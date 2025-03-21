const express = require("express");
const { orderController } = require("../../controllers");
const router = express.Router();

// Create Order
router.post("/create", orderController.createOrder);

module.exports = router;
