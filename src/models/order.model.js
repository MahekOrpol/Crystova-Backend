const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const orderSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", // Refers to Products schema
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
      required: true,
    },
    productPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    quantity: {
      type: String,
    },
    productSize: {
        type: [String], 
        default: [],  
      },
    discount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    status:{
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

/**
 * @typedef Order
 */
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
