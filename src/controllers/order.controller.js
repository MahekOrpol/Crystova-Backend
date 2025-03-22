const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
// const SavedAddress = require("../models/savedAddress.model"); // Import the SavedAddress model
const Joi = require("joi");
const mongoose = require("mongoose");
const SavedAddress = require("../models/savedAddress.model");

// CREATE ORDER
const createOrder = catchAsync(async (req, res) => {
  if (req.body.products && typeof req.body.products === "string") {
    try {
      req.body.products = JSON.parse(req.body.products);
    } catch (err) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid products JSON format"
      );
    }
  }

  const saveInfo = req.body.saveInfo === true || req.body.saveInfo === "true";

  const schema = Joi.object({
    userId: Joi.string().required(),
    email: Joi.string()
      .trim()
      .lowercase()
      .email({ tlds: { allow: false } })
      .required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    address: Joi.string().required(),
    country: Joi.string().required(),
    apartment: Joi.string().optional().allow(""),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    razorpayId: Joi.string().optional(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().required(),
    couponCode: Joi.string().optional(),
    status: Joi.string()
      .valid("pending", "shipped", "delivered", "cancelled")
      .optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
    products: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          quantity: Joi.number().required(),
          price: Joi.number().required(),
        })
      )
      .required(),
    saveInfo: Joi.boolean().optional(),
  });

  // const { error, value } = schema.validate(req.body);
  const { error, value } = schema.validate(req.body, { allowUnknown: true });

  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  // Format product IDs to ObjectId
  const formattedProducts = value.products.map((product) => ({
    productId: mongoose.Types.ObjectId(product.productId),
    quantity: product.quantity,
    price: product.price,
  }));

  // Create the order
  const order = await Order.create({
    userId: mongoose.Types.ObjectId(value.userId),
    razorpayId: value.razorpayId,
    discountTotal: value.discountTotal || 0,
    totalPrice: value.totalPrice,
    couponCode: value.couponCode,
    status: value.status || "pending",
    paymentStatus: value.paymentStatus || "Unpaid",
    products: formattedProducts,
    email: value.email,
    firstName: value.firstName,
    lastName: value.lastName,
    address: value.address,
    country: value.country,
    apartment: value.apartment,
    city: value.city,
    state: value.state,
    zipCode: value.zipCode,
    phoneNumber: value.phoneNumber,
  });

  // ✅ Conditionally save contact & delivery info if saveInfo is true
  if (saveInfo) {
    await SavedAddress.findOneAndUpdate(
      { userId: mongoose.Types.ObjectId(value.userId) },
      {
        userId: mongoose.Types.ObjectId(value.userId),
        email: value.email,
        firstName: value.firstName,
        lastName: value.lastName,
        address: value.address,
        country: value.country,
        apartment: value.apartment,
        city: value.city,
        state: value.state,
        zipCode: value.zipCode,
        phoneNumber: value.phoneNumber,
      },
      { upsert: true, new: true }
    );
  }

  res.status(httpStatus.CREATED).json({
    status: true,
    message: "Order created successfully",
    data: order,
  });
});

module.exports = {
  createOrder,
};
