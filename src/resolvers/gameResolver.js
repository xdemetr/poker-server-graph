import moment from 'moment';
import { checkIsAdmin, checkIsAuth } from './authResolver.js';
import Game from '../models/gameModel.js';
import Player from '../models/playerModel.js';
import paginate from 'express-paginate';

Array.prototype.max = function () {
  return Math.max.apply(null, this);
};

export const gameResolver = {
  getAllGames: async ({ limit = 10, page = 1 }, req) => {
    const skip = page * limit - limit;
    const modifyReq = {
      ...req,
      limit,
      page,
    };

    const [results, itemCount] = await Promise.all([
      Game.find({})
        .sort({ date: -1 })
        .populate({
          path: 'players',
          model: 'Player',
        })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec(),
      Game.count({}),
    ]);

    const pageCount = Math.ceil(itemCount / limit);
    paginate.getArrayPages(modifyReq)(5, pageCount, page);

    return {
      pageCount,
      itemCount,
      data: results,
      has_more: page < pageCount,
      pages: paginate.getArrayPages(modifyReq)(5, pageCount, page),
    };
  },

  getGame: async ({ name }) => {
    if (!name) {
      throw new Error('Не указан id игры');
    }

    const game = await Game.findOne({ name })
      .populate({
        path: 'players',
        model: 'Player',
      })
      .exec();

    if (!game) {
      throw new Error('Игра не найдена');
    }

    return game;
  },

  getGameCount: async () => {
    const count = await Game.count({});
    return count;
  },

  createGame: async ({ gameInput: { name, date, isBigGame, buyIn, players } }, req) => {
    checkIsAdmin(req);

    const gameName = name ? name.trim() : moment().format('DD-MM-YYYY');

    const existGame = await Game.findOne({ name: gameName });

    if (existGame) {
      throw new Error(`На дату ${gameName} уже есть игра.`);
    }

    const newGame = new Game({
      name: name ? name : moment().format('DD-MM-YYYY'),
      players,
      buyIn,
      isBigGame,
      date: name ? new Date(name.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1')) : Date.now(),
    });

    await newGame.save();
    return newGame;
  },

  saveGameResult: async ({ resultInput: { id, players, results, name, date } }, req) => {
    checkIsAdmin(req);

    if (!id) {
      throw new Error('Не указан id игры');
    }

    const gameDate = new Date(name.replace(/(\d+).(\d+).(\d+)/, '$3/$2/$1'));

    const updatedGame = {
      players,
      results,
      name: moment(gameDate).format('DD-MM-YYYY'),
      date: gameDate,
    };

    await Game.findByIdAndUpdate(id, updatedGame).then((game) => {
      game.save().then((game) => {
        // Обновление игр в каждом игроке
        const res = players.map((player, index) => {
          Player.findById(player)
            .then((player) => {
              const gameResult = {
                game: game._id,
                result: results[index],
              };

              const updateResultIndex = player.results.findIndex(
                (r) => r.game.toString() === game._id.toString(),
              );

              if (updateResultIndex >= 0) {
                player.results[updateResultIndex].result = gameResult.result;
              } else {
                player.results.push(gameResult);
              }

              player.balance = player.results.reduce((acc, val) => acc + val.result, 0);
              player.gameCount = player.results.length;

              let seriesOfWinsArray = [];
              let seriesOfLooseArray = [];

              player.results.reduce((acc, item) => {
                if (item.result > 0) {
                  acc += 1;
                  seriesOfWinsArray.push(+acc);
                }

                if (item.result < 0) {
                  acc = 0;
                }

                return acc;
              }, 0);

              player.results.reduce((acc, item) => {
                if (item.result < 0) {
                  acc += 1;
                  seriesOfLooseArray.push(+acc);
                }

                if (item.result > 0) {
                  acc = 0;
                }

                return acc;
              }, 0);

              player.maxSeriesOfWin = seriesOfWinsArray.length > 0 ? seriesOfWinsArray.max() : 0;
              player.maxSeriesOfLoose =
                seriesOfLooseArray.length > 0 ? seriesOfLooseArray.max() : 0;

              player.save().then((pl) => pl);
            })
            .catch((e) => console.log(e));
        });
        // end Обновление игр в каждом игроке

        return res;
      });
    });

    const res = await Game.findById(id)
      .populate({
        path: 'players',
        model: 'Player',
        populate: {
          path: 'results',
          populate: {
            path: 'game',
            model: 'Game',
          },
        },
      })
      .exec();

    return res;
  },

  deleteGame: async ({ id: gameId }, req) => {
    checkIsAdmin(req)

    return await Game.findByIdAndRemove(gameId).then((game) => {
      if (!game) {
        throw new Error('Игра не найдена');
      }

      // Удаление игры в каждом игроке и обновление баланса
      const gamePlayers = game.players;

      gamePlayers.map((pl) => {
        Player.findById(pl).then((player) => {
          const filteredGames = player.results.filter((g) => g.game.toString() !== gameId);
          player.results = [...filteredGames];
          player.balance = player.results.reduce((acc, val) => acc + val.result, 0);
          player.gameCount = player.results.length;

          player.save().then((pl) => pl);
        });
      });

      return game;
    });
  },
};
