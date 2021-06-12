import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const gameSchema = new Schema({
  name: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
  ]
  ,
  buyIn: {
    type: Number,
    default: 500,
  },
  results: [
    {
      type: Number,
    },
  ],
  isBigGame: {
    type: Boolean,
  },
});

const gameModel = mongoose.model('Game', gameSchema);
export default gameModel;
