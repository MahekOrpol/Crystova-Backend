const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model"); // ✅ Corrected model import
const Joi = require("joi");
const mongoose = require("mongoose");

// CREATE ORDER
const createOrder = catchAsync(async (req, res) => {
  // If products come as JSON string (form-data), parse it
  if (req.body.products && typeof req.body.products === "string") {
    try {
      req.body.products = JSON.parse(req.body.products);
    } catch (err) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid products JSON format");
    }
  }

  // Joi validation
  const schema = Joi.object({
    userId: Joi.string().required(),
    addressId: Joi.string().required(),
    razorpayId: Joi.string(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().required(),
    couponCode: Joi.string().optional(),
    status: Joi.string().valid("pending", "shipped", "delivered", "cancelled").optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
    products: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().required(),
        price: Joi.number().required(),
      })
    ).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  // Format product ObjectIds
  const formattedProducts = value.products.map((product) => ({
    productId: mongoose.Types.ObjectId(product.productId),
    quantity: product.quantity,
    price: product.price,
  }));

  // Create order
  const order = await Order.create({
    userId: mongoose.Types.ObjectId(value.userId),
    addressId: mongoose.Types.ObjectId(value.addressId),
    razorpayId: value.razorpayId,
    discountTotal: value.discountTotal || 0,
    totalPrice: value.totalPrice,
    couponCode: value.couponCode,
    status: value.status,
    paymentStatus: value.paymentStatus,
    products: formattedProducts,
  });

  

  res.status(httpStatus.CREATED).json({
    status: true,
    message: "Order created successfully",
    data: order,
  });
});

module.exports = {
  createOrder,
};
