const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
const OrderDetails = require("../models/orderDetails.model");
const SavedAddress = require("../models/savedAddress.model");
const Joi = require("joi");
const mongoose = require("mongoose");

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

  const pendingOrderDetails = await OrderDetails.find({ userId, orderId: 0 });
  if (!pendingOrderDetails || pendingOrderDetails.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No pending order details found for this user");
  }
  ``

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

  if (saveInfo) {
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

  res.status(httpStatus.CREATED).json({
    status: true,
    message: "Order created successfully and orderId updated in OrderDetails",
    data: order,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find()
    .populate("productId") 
    .populate("userId"); 

  res.status(httpStatus.OK).json({
    status: true,
    message: "Orders fetched successfully",
    data: orders,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const schema = Joi.object({
    status: Joi.string().valid("pending", "shipped", "delivered", "cancelled").required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const { status } = value;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  order.status = status;
  await order.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order status updated successfully",
    data: order,
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("userId") // Populate user details
    .lean();

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const orderDetails = await OrderDetails.find({ orderId: order._id });

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order fetched successfully",
    data: {
      order,
      orderDetails,
    },
  });
});

const getUserOrders = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const orders = await Order.find({ userId: mongoose.Types.ObjectId(userId) })
    .populate("userId") // Optional: Populate user data
    .lean();

  if (!orders || orders.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No orders found for this user");
  }

  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      const orderDetails = await OrderDetails.find({ orderId: order._id });
      return {
        ...order,
        orderDetails,
      };
    })
  );

  res.status(httpStatus.OK).json({
    status: true,
    message: "User orders fetched successfully",
    data: ordersWithDetails,
  });
});


module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getSingleOrder,
  getUserOrders
};
