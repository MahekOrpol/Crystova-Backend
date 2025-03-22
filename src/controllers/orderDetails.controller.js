const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/orderDetails.model");
const Joi = require("joi");
const OrderDetails = require("../models/orderDetails.model");

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
    order: Joi.string(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  // Enforce status as 'pending' while creating
  const order = await OrderDetails.create(value);
  res
    .status(httpStatus.CREATED)
    .json({ status: true, message: "Order created successfully", data: order });
});




const updateOrderStatus = catchAsync(async (req, res) => {
    const { userId, productId } = req.params;
  
    if (!userId || !productId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'userId and productId are required');
    }
  
    const schema = Joi.object({
        productPrice: Joi.number(),
        quantity: Joi.number(),
        productSize: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
        discount: Joi.number(),
      });
      
  
    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
    }
  
    const order = await OrderDetails.findOneAndUpdate(
      { userId, productId },
      value,
      { new: true }
    );
  
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }
  
    res.status(httpStatus.OK).json({
      status: true,
      message: 'Order updated successfully',
      data: order,
    });
  });
  
const getOrderById = catchAsync(async (req, res) => {
    const { userId } = req.params;
  console.log('userId :>> ', userId);
    const orderId = 0
    const orders = await OrderDetails.find({ userId,orderId })
      .populate("productId")
      .populate("userId");
  
    if (!orders || orders.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "No orders found for this user");
    }
  
    res.status(httpStatus.OK).json({
      status: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  });
  
  

const getAllOrders = catchAsync(async (req, res) => {
  const orders = await OrderDetails.find()
    .populate("productId") // Populate product details (optional)
    .populate("userId"); // Populate user details (optional)

  res.status(httpStatus.OK).json({
    status: true,
    message: "Orders fetched successfully",
    data: orders,
  });
});

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderById,
  getAllOrders,
};
