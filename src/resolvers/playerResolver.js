import Player from '../models/playerModel.js';
import Game from '../models/gameModel.js';
import { checkIsAdmin, checkIsAuth } from './authResolver.js';

const playerHistory = async (handle) => {
  return await Player.findOne({ handle })
    .populate({
      path: 'results.game',
      model: 'Game',
      select: ['name', 'date'],
      populate: {
        path: 'players',
        model: 'Player',
      },
    })
    .exec()
    .then((player) => {
      const sortResults = player.results.sort((a, b) => (a.game.date > b.game.date ? 1 : -1));
      player.results = sortResults;

      let resultsArray = [];

      sortResults.reduce((acc, currentValue, index) => {
        resultsArray.push({
          value: acc + currentValue.result,
          date: new Date(sortResults[index].game.date).toDateString(),
          name: player.name,
        });

        return acc + currentValue.result;
      }, 0);

      return resultsArray;
    });
};

export const playerResolver = {
  /**
   * Получение всех игроков
   * @param args
   * @param req
   * @returns {Promise<*>}
   */
  getAllPlayers: async (args) => {
    let sort;
    const sortByF = args?.sortBy ? { [args.sortBy]: -1 } : null;
    sort = { ...sortByF, isRegular: -1, name: 1 };
    const res = await Player.find()
      .sort(sort)
      .populate({
        path: 'results.game',
        populate: {
          path: 'players',
          model: 'Player',
        },
      })
      .exec();
    return res;
  },

  /**
   * Получение игрока по id
   * @param playerId
   * @returns {Promise<*>}
   */
  getPlayer: async (playerId) => {
    const player = await Player.findById(playerId);

    if (!player) {
      throw new Error('Not found');
    }
    return player;
  },

  /**
   * @description Получение игроки по нику. Разворачиваем все его игры.
   * @param handle
   * @returns {Promise<Document<any, any>>}
   */
  getPlayerByHandle: async ({ handle = '' }) => {
    const existPlayer = await Player.findOne({ handle });
    if (!existPlayer) {
      throw new Error('Not found');
    }

    const player = await Player.findOne({ handle })
      .populate({
        path: 'results.game',
        populate: {
          path: 'players',
          model: 'Player',
        },
      })
      .exec()
      .then((player) => {
        const sortResults = player.results.sort((a, b) => (a.game.date < b.game.date ? 1 : -1));
        player.results = sortResults;
        return player;
      });

    return player;
  },
  getPlayerHistory: async ({ handle = '' }) => {
    return playerHistory(handle);
  },

  getPlayersHistory: async ({ handles = [] }) => {
    const arr = [];
    await handles.reduce(async (acc, item) => {
      const results = await playerHistory(item);
      arr.push(...results);
      return acc;
    }, []);

    return arr;
  },

  /**
   * Создание и обновление игрока
   * @param playerInput
   * @param req
   * @returns {Promise<*|Document<any, any>>}
   */
  createPlayer: async ({ playerInput }, req) => {
    checkIsAdmin(req)

    const { id, name, handle, isRegular, isShowInRating } = playerInput;
    const existPlayerHandle = await Player.findOne({ handle });

    if (!id) {
      if (existPlayerHandle) {
        throw new Error('Игрок с таким ником уже есть.');
      }
      const newPlayer = new Player({ name, handle, isRegular, isShowInRating });
      await newPlayer.save();

      return newPlayer;
    }

    if (id) {
      if (existPlayerHandle && existPlayerHandle.handle === handle && existPlayerHandle.id != id) {
        throw new Error('Игрок с таким ником уже есть.');
      }

      await Player.findByIdAndUpdate(id, {
        name,
        handle,
        isRegular,
        isShowInRating,
      });

      const result = await Player.findById(id);
      return result;
    }
  },
};
