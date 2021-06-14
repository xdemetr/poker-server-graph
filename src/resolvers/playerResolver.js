import Player from '../models/playerModel.js';
import Game from '../models/gameModel.js';
import { checkIsAuth } from './authResolver.js';

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
    const res = await Player.find().sort(sort);
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

  /**
   * Создание и обновление игрока
   * @param playerInput
   * @param req
   * @returns {Promise<*|Document<any, any>>}
   */
  createPlayer: async ({ playerInput }, req) => {
    checkIsAuth(req.isAuth);

    const { _id, name, handle, isRegular, isShowInRating } = playerInput;

    const existPlayerHandle = await Player.findOne({ handle });
    if (_id) {
      const updatedPlayer = await Player.findByIdAndUpdate(_id, {
        name,
        handle,
        isRegular,
        isShowInRating,
      });
      await updatedPlayer.save();
      const result = await Player.findById(_id);
      return result;
    }

    if (existPlayerHandle) {
      throw new Error('Handle already exist');
    }

    const newPlayer = new Player({ name, handle, isRegular, isShowInRating });
    await newPlayer.save();

    return newPlayer;
  },
};
