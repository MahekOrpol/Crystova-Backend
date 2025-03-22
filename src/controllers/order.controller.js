const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
const OrderDetails = require("../models/orderDetails.model");
const SavedAddress = require("../models/savedAddress.model");
const Joi = require("joi");
const mongoose = require("mongoose");

// CREATE ORDER
const createOrder = catchAsync(async (req, res) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    razorpayId: Joi.string().optional(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().required(),
    couponCode: Joi.string().optional(),
    status: Joi.string().valid("pending", "shipped", "delivered", "cancelled").optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
    saveInfo: Joi.boolean().optional(),

    // Address Details (optional but validated if saveInfo is true)
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    address: Joi.string().optional(),
    country: Joi.string().optional(),
    apartment: Joi.string().optional().allow(""),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
  });

  const { error, value } = schema.validate(req.body, { allowUnknown: true });
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const { userId, saveInfo } = value;

  // ✅ 1. Fetch pending orderDetails with orderId: 0
  const pendingOrderDetails = await OrderDetails.find({ userId, orderId: 0 });
  if (!pendingOrderDetails || pendingOrderDetails.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No pending order details found for this user");
  }

  // ✅ 2. Create the main Order
  const order = await Order.create({
    userId: mongoose.Types.ObjectId(userId),
    razorpayId: value.razorpayId,
    discountTotal: value.discountTotal || 0,
    totalPrice: value.totalPrice,
    couponCode: value.couponCode,
    status: value.status || "pending",
    paymentStatus: value.paymentStatus || "Unpaid",
  });

  // ✅ 3. Update those OrderDetails with the newly created order._id
  await OrderDetails.updateMany(
    { userId, orderId: 0 },
    { $set: { orderId: order._id } }
  );

  // ✅ 4. If saveInfo is true, save the address
  if (saveInfo) {
    // Validate required address fields for saving
    const addressSchema = Joi.object({
      email: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      address: Joi.string().required(),
      country: Joi.string().required(),
      apartment: Joi.string().optional().allow(""),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      phoneNumber: Joi.string().required(),
    });

    const { error: addressError } = addressSchema.validate(value);
    if (addressError) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Address fields are missing for saveInfo");
    }

    await SavedAddress.findOneAndUpdate(
      { userId: mongoose.Types.ObjectId(userId) },
      {
        userId: mongoose.Types.ObjectId(userId),
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

  // ✅ 5. Response back
  res.status(httpStatus.CREATED).json({
    status: true,
    message: "Order created successfully and orderId updated in OrderDetails",
    data: order,
  });
});

module.exports = {
  createOrder,
};
