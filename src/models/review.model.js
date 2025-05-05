const mongoose = require("mongoose");
const { toJSON} = require("./plugins");

const reviewSchema = mongoose.Schema(
  {
    msg: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    rating: {
        type: String,
      },
  },
  {
    timestamps: true,
  }
);
reviewSchema.plugin(toJSON);
/**
 * @typedef Review
 */
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
