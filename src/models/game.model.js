const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const gameSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description:{
      type: String,
      trim: true,
    },
    price : {
      type: Number
    },
    image: {
      type: String,
    },
    category: {
      type: String,
    },
    isActive : {
      type: Boolean,
      default: true
    }

  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
gameSchema.plugin(toJSON);
gameSchema.plugin(paginate);

/**
 * @typedef Game
 */
const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
