import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const playerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  handle: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  gameCount: {
    type: Number,
    default: 0,
  },
  maxSeriesOfWin: {
    type: Number,
    default: 0,
  },
  maxSeriesOfLoose: {
    type: Number,
    default: 0,
  },
  results: [
    {
      game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
      },
      result: {
        type: Number,
      },
    },
  ],
  isRegular: {
    type: Boolean,
    default: false,
  },
  isShowInRating: {
    type: Boolean,
    default: true,
  },
});

const playerModel = mongoose.model('Player', playerSchema);
export default playerModel;
