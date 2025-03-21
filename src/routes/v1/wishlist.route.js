const express = require("express");
const { handleWishlist, getAllWishlists } = require("../../controllers/wishlist.controller");

const router = express.Router();

router.route("/create")
  .post(handleWishlist)  // Add to wishlist
  .delete(handleWishlist) // Remove from wishlist

router.get("/:userId", handleWishlist); // Get wishlist
router.get("/admin/wishlists", getAllWishlists);

module.exports = router;
