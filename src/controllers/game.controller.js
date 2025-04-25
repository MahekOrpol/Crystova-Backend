const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const Joi = require('joi');
const { password } = require('../validations/custom.validation');
const { User, Game } = require('../models');
const ApiError = require('../utils/ApiError');
const { saveFile, removeFile } = require('../utils/helper');

const createGame = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      category: Joi.string().required(),
    }),
  },
  handler: async (req, res) => {

    // check if game already exists
    const gameWithNameExits = await Game.findOne({ name: req.body.name });
    if (gameWithNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Game already exists');
    }

    if (req.files && req.files?.image) {
      const { upload_path } = await saveFile(req.files?.image);
      req.body.image = upload_path;
    }

    const game = await new Game(req.body).save();
    return res.status(httpStatus.CREATED).send(game);
  }
};

const getAllGame = {
  validation:{
    body: Joi.object().keys({
      name: Joi.string().required(),
      description: Joi.string().required(),
      price: Joi.number().required(),
      category: Joi.string().required(),
      image : Joi.string()
    }),
  },
  handler: async (req, res) => {
    const games = await Game.find({
      ...(req.query?.name && {name : req.query?.name})
    });
    return res.status(httpStatus.OK).send(games);
  }
};

const updateGame = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const gameExits = await Game.findOne({ _id });
    if (!gameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Game not found');
    }

    // check if game already exists
    const gameWithNameExits = await Game.findOne({ name: req.body?.name, _id: { $ne: _id } }).exec();
    if (gameWithNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Game already exists');
    }

    if (req.files && req.files?.image) {
      const { upload_path } = await saveFile(req.files?.image);
      req.body.image = upload_path;

      // delete old image
      await removeFile(gameExits?.image);
    }

    // update game
    const updateGame = await Game.findOneAndUpdate({ _id }, req.body, { new: true })
    return res.status(httpStatus.OK).send(updateGame);
  }
};


const deleteGame = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const gameExits = await Game.findOne({ _id });
    if (!gameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Game not found');
    }

    // delete old image
    await removeFile(gameExits?.image);

    // delete game
    await Game.deleteOne({ _id });
    return res.status(httpStatus.OK).send({ message: 'Game deleted successfully'});
  }
};








module.exports = {
  createGame,
  getAllGame,
  updateGame,
  deleteGame,
};
