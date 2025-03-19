const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const productsSchema = mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: String,
      required: true,
      trim: true,
    },

    best_selling: {
      type: String,
      trim: true,
      default: "0",
    },

    review: {
      type: String,
      trim: true,
    },
    rating: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    productsDescription: {
      type: String,
      trim: true,
    },
    salePrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    regularPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    // prices: [
    //     {
    //       salePrice: {
    //         type: Number,
    //       },
    //       regularPrice: {
    //         type: Number,
    //       },
    //     },
    //   ],
    image: {
      type: [String],
      default: [],
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: String,
    },
    discount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
    },
    // productSize: {
    //   type: String,
    // },
    productSize: {
      type: [String], // Changed from String to an array of strings
      default: [], // Default value as an empty array
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
productsSchema.plugin(toJSON);
productsSchema.plugin(paginate);

/**
 * @typedef Products
 */
const Products = mongoose.model("Products", productsSchema);

module.exports = Products;
