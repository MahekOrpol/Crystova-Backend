const Joi = require("joi");
const Review = require("../models/review.model");
const httpStatus = require("http-status");
const { saveFile } = require("../utils/helper");

const createReviewPro = {
  validation: {
    body: Joi.object().keys({
    //   image: Joi.string().required(),
      msg: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
    }),
  },
  handler: async (req, res) => {
    try {
      const body = {
        ...req.body,
        productId: req.body.productId, // Make sure you pass productId in the route
      };
      
      if (req.files && req.files?.image) {
        const { upload_path } = await saveFile(req.files?.image);
        req.body.image = upload_path;
      }
  
      const rating = await new Review(body).save();
      return res.status(httpStatus.CREATED).send(rating);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message });
    }
  },
};

module.exports = {
  createReviewPro,
};
