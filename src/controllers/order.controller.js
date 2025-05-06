const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
const OrderDetails = require("../models/orderDetails.model");
const SavedAddress = require("../models/savedAddress.model");
const Joi = require("joi");
const mongoose = require("mongoose");
const { Products } = require("../models");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const createOrder = catchAsync(async (req, res) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    razorpayId: Joi.string().optional(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().required(),
    couponCode: Joi.string().optional(),
    status: Joi.string()
      .valid("pending", "shipped", "delivered", "cancelled")
      .optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
    saveInfo: Joi.boolean().optional(),
    email: Joi.string()
      .trim()
      .lowercase()
      .email({ tlds: { allow: false } })
      .optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    address: Joi.string().optional(),
    country: Joi.string().optional(),
    apartment: Joi.string().optional().allow(""),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    selectedSize: Joi.string().required(),
    selectedqty: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body, { allowUnknown: true });
  if (error)
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const { userId, saveInfo } = value;
  const pendingOrderDetails = await OrderDetails.find({ userId, orderId: 0 });
  if (!pendingOrderDetails || pendingOrderDetails.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No pending order details found for this user"
    );
  }

  const order = await Order.create({
    userId: mongoose.Types.ObjectId(userId),
    razorpayId: value.razorpayId,
    discountTotal: value.discountTotal || 0,
    totalPrice: value.totalPrice,
    couponCode: value.couponCode,
    status: value.status || "pending",
    paymentStatus: value.paymentStatus || "Unpaid",
    selectedSize: value.selectedSize,
    selectedqty: value.selectedqty,
  });

  await OrderDetails.updateMany(
    { userId, orderId: 0 },
    { $set: { orderId: order.orderId } }
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
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Address fields are missing for saveInfo"
      );
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
  const orderDetails = await OrderDetails.find({ orderId: order.orderId });
  for (const detail of orderDetails) {
    const selectedqty = Number(detail.selectedqty);
    console.log("selectedqty :>> ", selectedqty);
    const product = await Products.findById(detail.productId);
    if (product) {
      const currentQty = Number(product.quantity); // convert product quantity to int
      const newQty = currentQty - selectedqty;

      console.log("currentQty :>> ", currentQty);
      // Update product quantity in DB (store as string if needed)
      await Products.findByIdAndUpdate(detail.productId, {
        quantity: newQty.toString(),
      });

      console.log(`Updated product ${product._id} quantity to ${newQty}`);
    }
  }

  return res.status(httpStatus.CREATED).json({
    status: true,
    message: "Order created successfully and orderId updated in OrderDetails",
    data: order,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find().populate("productId").populate("userId");

  res.status(httpStatus.OK).json({
    status: true,
    message: "Orders fetched successfully",
    data: orders,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const schema = Joi.object({
    razorpayId: Joi.string().optional(),
    discountTotal: Joi.number().optional(),
    totalPrice: Joi.number().optional(),
    couponCode: Joi.string().optional(),
    status: Joi.string()
      .valid("pending", "confirm", "shipped", "delivered", "cancelled")
      .optional(),
    paymentStatus: Joi.string().valid("Paid", "Unpaid").optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error)
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const { status } = value;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  Object.assign(order, value);
  await order.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order status updated successfully",
    data: order,
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ orderId })
    .populate("userId") // Populate user details
    .lean();

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const orderDetails = await OrderDetails.find({ orderId: order.orderId })
    .populate("productId") // Populate user details
    .lean();

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
    .populate("userId")
    .lean();

  if (!orders || orders.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No orders found for this user");
  }

  const ordersWithDetails = await Promise.all(
    orders.map(async (order) => {
      // Fetch order details
      const orderDetails = await OrderDetails.find({ orderId: order.orderId })
        .populate({
          path: "productId", // Assuming productId is stored in OrderDetails
          model: "Products", // Reference to the Product model
        })
        .lean();

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

const getSavedAddress = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const savedAddress = await SavedAddress.findOne({ userId });

    if (!savedAddress) {
      return res.status(404).json({ message: "No saved address found" });
    }

    res.status(200).json(savedAddress);
  } catch (error) {
    console.error("Error fetching saved address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const printOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId }).populate("userId").lean();

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  const orderDetails = await OrderDetails.find({ orderId })
    .populate("productId")
    .lean();

  res.status(httpStatus.OK).json({
    status: true,
    message: "Order ready for printing",
    data: {
      order,
      orderDetails,
    },
  });
});

const downloadAllOrdersPDF = catchAsync(async (req, res) => {
  const orders = await Order.find().populate("userId").lean();
  if (!orders.length) {
    throw new ApiError(httpStatus.NOT_FOUND, "No orders found");
  }

  const orderIds = orders.map((order) => order.orderId);
  const allOrderDetails = await OrderDetails.find({
    orderId: { $in: orderIds },
  })
    .populate("productId")
    .lean();

  const orderDetailsMap = {};
  allOrderDetails.forEach((detail) => {
    console.log('detail :>> ', detail);
    const id = detail.orderId;
    if (!orderDetailsMap[id]) orderDetailsMap[id] = [];
    orderDetailsMap[id].push(detail);
  });

  const doc = new PDFDocument({ margin: 50 });

  const outputPath = path.join(__dirname, `../uploads/all_orders.pdf`);
  doc.pipe(fs.createWriteStream(outputPath));

  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("All Orders Summary", { align: "center" })
    .moveDown(2);

  const startX = 20;
  const rowHeight = 30;
  const colWidths = {
    orderId: 50,
    name: 90,
    quantity: 50,
    price: 50,
    user: 60,
    email: 130,
    totalPrice: 50,
    status: 50,
    paymentStatus: 50,
  };

  let currentY = doc.y;

  // Draw table header ONCE
  
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Order ID", startX, currentY, {
      width: colWidths.orderId,
      lineBreak: false,
    })
    .text("Product Name", startX + colWidths.orderId, currentY, {
      width: colWidths.name,
      lineBreak: false,
    })
    .text("Quantity", startX + colWidths.orderId + colWidths.name, currentY, {
      width: colWidths.quantity,
      lineBreak: false,
    })
    .text(
      "Price",
      startX + colWidths.orderId + colWidths.name + colWidths.quantity,
      currentY,
      { width: colWidths.price, lineBreak: false }
    )
    .text(
      "User",
      startX +
        colWidths.orderId +
        colWidths.name +
        colWidths.quantity +
        colWidths.price,
      currentY,
      { width: colWidths.user, lineBreak: false }
    )
    .text(
      "Email",
      startX +
        colWidths.orderId +
        colWidths.name +
        colWidths.quantity +
        colWidths.price +
        colWidths.user,
      currentY,
      { width: colWidths.email, lineBreak: false }
    )
    .text(
      "Total Price",
      startX +
        colWidths.orderId +
        colWidths.name +
        colWidths.quantity +
        colWidths.price +
        colWidths.user +
        colWidths.email,
      currentY,
      { width: colWidths.totalPrice, lineBreak: true }
    )
    .text(
      "Status",
      startX +
        colWidths.orderId +
        colWidths.name +
        colWidths.quantity +
        colWidths.price +
        colWidths.user +
        colWidths.email +
        colWidths.totalPrice,
      currentY,
      { width: colWidths.status, lineBreak: false }
    )
    .text(
      "Payment Statue",
      startX +
        colWidths.orderId +
        colWidths.name +
        colWidths.quantity +
        colWidths.price +
        colWidths.user +
        colWidths.email +
        colWidths.totalPrice +
        colWidths.status,
      currentY,
      { width: colWidths.paymentStatus,lineBreak: true}
    );

  currentY += rowHeight;
  doc
  .moveTo(startX, currentY - 5)
  .lineTo(595, currentY - 5)
  .stroke();

  // Table body
  doc.font("Helvetica").fontSize(10).fillColor("black");

  for (const order of orders) {
    const orderDetailList = orderDetailsMap[order.orderId] || [];

    const rows =
      orderDetailList.length > 0 ? orderDetailList : [{ empty: true }];

    for (const detail of rows) {
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;

        // Redraw header on new page
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("black")
          .text("Order ID", startX, currentY, {
            width: colWidths.orderId,
            lineBreak: false,
          })
          .text("Product Name", startX + colWidths.orderId, currentY, {
            width: colWidths.name,
            lineBreak: false,
          })
          .text(
            "Quantity",
            startX + colWidths.orderId + colWidths.name,
            currentY,
            { width: colWidths.quantity, lineBreak: false }
          )
          .text(
            "Price",
            startX + colWidths.orderId + colWidths.name + colWidths.quantity,
            currentY,
            { width: colWidths.price, lineBreak: false }
          )
          .text(
            "User",
            startX +
              colWidths.orderId +
              colWidths.name +
              colWidths.quantity +
              colWidths.price,
            currentY,
            { width: colWidths.user, lineBreak: false }
          )
          .text(
            "Email",
            startX +
              colWidths.orderId +
              colWidths.name +
              colWidths.quantity +
              colWidths.price +
              colWidths.user,
            currentY,
            { width: colWidths.email, lineBreak: false }
          )
          .text(
            "Total Price",
            startX +
              colWidths.orderId +
              colWidths.name +
              colWidths.quantity +
              colWidths.price +
              colWidths.user +
              colWidths.email,
            currentY,
            { width: colWidths.totalPrice, lineBreak: true }
          )
          .text(
            "Status",
            startX +
              colWidths.orderId +
              colWidths.name +
              colWidths.quantity +
              colWidths.price +
              colWidths.user +
              colWidths.email +
              colWidths.totalPrice,
            currentY,
            { width: colWidths.status, lineBreak: false }
          )
          .text(
            "Payment Status",
            startX +
              colWidths.orderId +
              colWidths.name +
              colWidths.quantity +
              colWidths.price +
              colWidths.user +
              colWidths.email +
              colWidths.totalPrice +
              colWidths.status,
            currentY,
            { width: colWidths.paymentStatus, lineBreak: true }
          );

        currentY += rowHeight;
        doc.font("Helvetica").fontSize(10).fillColor("black");
      }

      const name = detail.empty ? "-" : detail.productId?.name || "-";
      const qty = detail.empty ? "0" : detail.quantity.toString();
      const price = detail.empty ? "$0" : `$${detail.productId?.price || 0}`;

      doc
      .moveTo(startX, currentY - 5)
      .lineTo(595, currentY - 5)
      .stroke();

      doc
        .text(order.orderId, startX, currentY, {
          width: colWidths.orderId,
          lineBreak: false,
        })
        .text(name, startX + colWidths.orderId, currentY, {
          width: colWidths.name,
          lineBreak: false,
        })
        .text(qty, startX + colWidths.orderId + colWidths.name, currentY, {
          width: colWidths.quantity,
          lineBreak: false,
        })
        .text(
          price,
          startX + colWidths.orderId + colWidths.name + colWidths.quantity,
          currentY,
          { width: colWidths.price, lineBreak: false }
        )
        .text(
          order.userId?.name || "-",
          startX +
            colWidths.orderId +
            colWidths.name +
            colWidths.quantity +
            colWidths.price,
          currentY,
          { width: colWidths.user, lineBreak: false }
        )
        .text(
          order.userId?.email || "-",
          startX +
            colWidths.orderId +
            colWidths.name +
            colWidths.quantity +
            colWidths.price +
            colWidths.user,
          currentY,
          { width: colWidths.email, lineBreak: false }
        )
        .text(
          `$${order.totalPrice}`,
          startX +
            colWidths.orderId +
            colWidths.name +
            colWidths.quantity +
            colWidths.price +
            colWidths.user +
            colWidths.email,
          currentY,
          { width: colWidths.totalPrice, lineBreak: false }
        )
        .text(
          order.status,
          startX +
            colWidths.orderId +
            colWidths.name +
            colWidths.quantity +
            colWidths.price +
            colWidths.user +
            colWidths.email +
            colWidths.totalPrice,
          currentY,
          { width: colWidths.status, lineBreak: false }
        )
        .text(
          order.paymentStatus,
          startX +
            colWidths.orderId +
            colWidths.name +
            colWidths.quantity +
            colWidths.price +
            colWidths.user +
            colWidths.email +
            colWidths.totalPrice +
            colWidths.status,
          currentY,
          { width: colWidths.paymentStatus, lineBreak: false }
        );

      currentY += rowHeight;
    }

    currentY += 10; // spacing between orders
  }
  doc
  .moveTo(startX, currentY - 5)
  .lineTo(595, currentY - 5)
  .stroke();

  doc.end();

  doc.on("finish", () => {
    res.status(httpStatus.OK).json({
      status: true,
      message: "All orders PDF generated successfully",
      data: { pdfUrl: `/uploads/all_orders.pdf` },
    });
  });
});

const downloadProductOrdersPDF = catchAsync(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid product ID");
  }

  const orderDetails = await OrderDetails.find({ productId })
    .populate("productId")
    .lean();
  if (!orderDetails.length) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No orders found for this product"
    );
  }

  const doc = new PDFDocument();
  const outputPath = path.join(
    __dirname,
    `../uploads/product_orders_${productId}.pdf`
  );
  doc.pipe(fs.createWriteStream(outputPath));

  doc
    .fontSize(16)
    .text(`Orders Containing Product: ${orderDetails[0].productId.name}`, {
      align: "center",
    })
    .moveDown();

  for (const detail of orderDetails) {
    const order = await Order.findOne({ orderId: detail.orderId })
      .populate("userId")
      .lean();
    if (order) {
      doc.fontSize(12).text(`Order ID: ${order.orderId}`);
      doc.text(`User: ${order.userId.firstName} ${order.userId.lastName}`);
      doc.text(`Email: ${order.userId.email}`);
      doc.text(`Qty Ordered: ${detail.quantity}`);
      doc.text(`Status: ${order.status}`);
      doc.text(`Total Price: $${order.totalPrice}`);
      doc.moveDown();
    }
  }

  doc.end();

  doc.on("finish", () => {
    res.status(httpStatus.OK).json({
      status: true,
      message: "Product orders PDF generated",
      data: {
        pdfUrl: `/uploads/product_orders_${productId}.pdf`,
      },
    });
  });
});

module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getSingleOrder,
  getUserOrders,
  getSavedAddress,
  printOrder,
  downloadAllOrdersPDF,
  downloadProductOrdersPDF,
};
