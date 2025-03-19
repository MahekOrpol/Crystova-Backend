const httpStatus = require("http-status");
const Wishlist = require("../models/wishlist.modal");
const Products = require("../models/products.modal");
const ApiError = require("../utils/ApiError");

/**
 * Handle wishlist operations in one API
 */
const handleWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (req.method === "POST") {
      // ✅ Add product to wishlist
      const product = await Products.findById(productId);
      if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
      }

      const existingWishlist = await Wishlist.findOne({ userId, productId });
      if (existingWishlist) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Product already in wishlist");
      }

      const wishlistItem = await Wishlist.create({ userId, productId });
      return res.status(httpStatus.CREATED).json({
        message: "Product added to wishlist",
        data: wishlistItem,
      });

    } else if (req.method === "DELETE") {
      // ✅ Remove product from wishlist
      const wishlistItem = await Wishlist.findOneAndDelete({ userId, productId });
      if (!wishlistItem) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found in wishlist");
      }

      return res.status(httpStatus.OK).json({
        message: "Product removed from wishlist",
      });

    } else if (req.method === "GET") {
      // ✅ Get wishlist for a user
      const { userId } = req.params;
      const wishlistItems = await Wishlist.find({ userId }).populate("productId", "productName salePrice image");

      return res.status(httpStatus.OK).json({
        message: "User wishlist retrieved",
        data: wishlistItems,
      });

    } else {
      throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, "Invalid request method");
    }
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  handleWishlist,
};
