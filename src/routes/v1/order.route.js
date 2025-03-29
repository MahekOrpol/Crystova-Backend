const express = require("express");

const auth = require("../../middlewares/auth");
const { orderController } = require("../../controllers");
const { getSavedAddress } = require("../../controllers/order.controller");
const router = express.Router();

// Create Order
router.post("/create", orderController.createOrder);
router.get("/get", orderController.getAllOrders);
router.put('/update-status/:orderId', orderController.updateOrderStatus);
router.get('/get-single/:orderId', orderController.getSingleOrder);
router.get('/get-user/:userId', orderController.getUserOrders);
router.get("/pending/:userId", orderController.getPendingOrder);

router.get("/address/:userId", getSavedAddress);

module.exports = router;
