const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const categoriesSchema = mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
categoriesSchema.plugin(toJSON);
categoriesSchema.plugin(paginate);

/**
 * @typedef Category
 */
const Category = mongoose.model("Category", categoriesSchema);

module.exports = Category;
