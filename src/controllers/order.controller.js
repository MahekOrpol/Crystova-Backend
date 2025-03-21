const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
const Joi = require("joi");

// CREATE ORDER
const createOrder = catchAsync(async (req, res) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    userId: Joi.string().required(),
    productPrice: Joi.number().required(),
    quantity: Joi.number().required(),
    productSize: Joi.alternatives()
      .try(Joi.array().items(Joi.string()), Joi.string())
      .optional(),
    discount: Joi.number().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  const order = await Order.create(value);
  res
    .status(httpStatus.CREATED)
    .json({ status: true, message: "Order created successfully", data: order });
});


module.exports = {
  createOrder,
};
