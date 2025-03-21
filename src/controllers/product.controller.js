const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const {
  authService,
  userService,
  tokenService,
  emailService,
} = require("../services");
const Joi = require("joi");
const { password } = require("../validations/custom.validation");
const { Products, Game } = require("../models");
const ApiError = require("../utils/ApiError");
const { saveFile, removeFile } = require("../utils/helper");

const createProduct = {
  validation: {
    body: Joi.object()
      .keys({
        categoryName: Joi.string().required(),
        quantity: Joi.string().required(),
        productName: Joi.string().required(),
        productsDescription: Joi.string().required(),
        regularPrice: Joi.number().precision(2).required(),
        salePrice: Joi.number().precision(2).required(),
        discount: Joi.number().precision(2),
        stock: Joi.string().required(),
        productSize: Joi.alternatives()
          .try(Joi.array().items(Joi.string()), Joi.string())
          .required(), // Accept array or string
        review: Joi.string(),
        rating: Joi.string(),
        sku: Joi.string().required(),
        best_selling: Joi.string(),
        image: Joi.array().items(Joi.string()).optional(),
        gender: Joi.string(),
      })
      .custom((value, helpers) => {
        if (value.salePrice > value.regularPrice) {
          return helpers.error(
            "Sale price cannot be greater than regular price"
          );
        }
        return value;
      }),
  },
  handler: async (req, res) => {
    console.log("req.body :>> ", req.body);

    // check if Product already exists
    const productsNameExits = await Products.findOne({
      productName: req.body.productName,
    });
    const productsskuExits = await Products.findOne({
      sku: req.body.sku,
    });
    if (productsNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Products already exists");
    }
    if (productsskuExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "SKU already exists");
    }

    // if (req.files && req.files?.image) {
    //   const { upload_path } = await saveFile(req.files?.image);
    //   req.body.image = upload_path;
    // }
    let imagePaths = [];
    if (req.files && req.files.image) {
      // If single file, wrap in array
      const filesArray = Array.isArray(req.files.image)
        ? req.files.image
        : [req.files.image];

      for (const file of filesArray) {
        const { upload_path } = await saveFile(file);
        imagePaths.push(upload_path);
      }
    }
    req.body.image = imagePaths;

    // const upload_path_array = [];
    // if (req.files) {
    //   for (let i = 0; i < req.files.length; i++) {
    //     const element = req.files[i];
    //     const imageUrl = await uploadOnCloudinary(element.path);
    //     upload_path_array.push(imageUrl.url);
    //   }
    // }
    // req.body.image = upload_path_array;
    req.body.best_selling = req.body.best_selling === "1" ? "1" : "0";

    req.body.discount = parseFloat(req.body.discount);
    req.body.salePrice = parseFloat(req.body.salePrice);
    req.body.regularPrice = parseFloat(req.body.regularPrice);

    if (typeof req.body.productSize === "string") {
      req.body.productSize = req.body.productSize
        .split(",")
        .map((size) => size.trim()); // Convert comma-separated string to array
    }

    if (isNaN(req.body.discount)) {
      req.body.discount = 0;
    }

    const products = await new Products(req.body).save();
    return res.status(httpStatus.CREATED).send(products);
  },
};

const getAllProducts = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string(),
      productName: Joi.string(),
      stock: Joi.string(),
      gender: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    // const products = await Products.find({
    //   ...(req.query?.productName && { productName: req.query?.productName }),
    // });
    // return res.status(httpStatus.OK).send(products);
    const filter = {};

    if (req.query?.categoryName) {
      filter.categoryName = req.query.categoryName; // Filter by category name
    }

    if (req.query?.productName) {
      filter.productName = req.query.productName; // Filter by product namenpm
    }

    if (req.query?.stock) {
      filter.stock = req.query.stock; // Filter by product name
    }
    if (req.query?.gender) {
      filter.gender = req.query.gender; // Filter by product name
    }

    const products = await Products.find(filter);
    return res.status(httpStatus.OK).send(products);
  },
};

const getTrendingProducts = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string().required(),
      productName: Joi.string().required(),
      productsDescription: Joi.string().required(),
      regularPrice: Joi.number().precision(2).required(),
      salePrice: Joi.number().precision(2).required(),
      discount: Joi.number().precision(2),
      stock: Joi.string().required(),
      productSize: Joi.alternatives()
        .try(Joi.array().items(Joi.string()), Joi.string())
        .required(),
      review: Joi.string(),
      rating: Joi.string(), // Ensure rating is a number
      sku: Joi.string().required(),
      image: Joi.string(),
    }),
  },
  handler: async (req, res) => {
    try {
      // const products = await Products.aggregate([
      //   {
      //     $addFields: {
      //       numericRating: { $toDouble: "$rating" } // Convert string rating to number
      //     }
      //   },
      //   { $sort: { numericRating: -1 } },
      //   { $limit: 4 }
      // ]);

      const products = await Products.find()
        .sort({ rating: -1 }) // Sort by highest rating
        .limit(4); // Get only the top 4 products

      return res.status(httpStatus.OK).send(products);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong",
        error: error.message,
      });
    }
  },
};

const getProductsByPrice = {
  handler: async (req, res) => {
    try {
      const maxPrice = req.query.salePrice
        ? parseFloat(req.query.salePrice)
        : 1999; // Default: ₹1,999

      const products = await Products.find({ salePrice: { $lt: maxPrice } }) // Filter products by salePrice
        .sort({ rating: -1 }); // Sort by highest rating

      return res.status(httpStatus.OK).json(products);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        error: error.message,
      });
    }
  },
};

const getBestSelling = {
  validation: {
    query: Joi.object().keys({
      best_selling: Joi.string().valid("1"), // Only allow "1" as a valid value
    }),
  },
  handler: async (req, res) => {
    try {
      const bestSellingProducts = await Products.find({ best_selling: "1" });

      return res.status(httpStatus.OK).send(bestSellingProducts);
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: "Error fetching best-selling products",
        error: error.message,
      });
    }
  },
};

const getOnSale = {
  handler: async (req, res) => {
    try {
      const onSaleProducts = await Products.find({ discount: { $gt: 0 } }) // Get products with discount > 0
        .sort({ discount: -1 }) // Sort by highest discount first
        .limit(4); // Limit to 4 products

      return res.status(httpStatus.OK).json(onSaleProducts);
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  },
};

const updateProducts = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const productExits = await Products.findOne({ _id });
    if (!productExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Products not found");
    }

    // check if Products already exists
    const productsWithNameExits = await Products.findOne({
      productName: req.body?.productName,
      _id: { $ne: _id },
    }).exec();
    if (productsWithNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Products already exists");
    }

    // if (req.files && req.files?.image) {
    //   const { upload_path } = await saveFile(req.files?.image);
    //   req.body.image = upload_path;

    //   // delete old image
    //   // await removeFile(productExits?.image);
    // }

    let imagePaths = [];
    if (req.files && req.files.image) {
      // If single file, wrap in array
      const filesArray = Array.isArray(req.files.image)
        ? req.files.image
        : [req.files.image];

      for (const file of filesArray) {
        const { upload_path } = await saveFile(file);
        imagePaths.push(upload_path);
      }
    }
    req.body.image = imagePaths;

    req.body.discount = parseFloat(req.body.discount);
    req.body.salePrice = parseFloat(req.body.salePrice);
    req.body.regularPrice = parseFloat(req.body.regularPrice);

    if (typeof req.body.productSize === "string") {
      req.body.productSize = req.body.productSize
        .split(",")
        .map((size) => size.trim()); // Convert comma-separated string to array
    }

    // update Products
    const updateProducts = await Products.findOneAndUpdate({ _id }, req.body, {
      new: true,
    });
    return res.status(httpStatus.OK).send(updateProducts);
  },
};

const deleteProduct = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const productExits = await Products.findOne({ _id });
    if (!productExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Products not found");
    }

    // delete old image
    if (Array.isArray(productExits.image)) {
      for (const imgPath of productExits.image) {
        if (imgPath) await removeFile(imgPath);
      }
    } else if (productExits.image) {
      await removeFile(productExits.image);
    }

    // delete Products
    await Products.deleteOne({ _id });
    return res
      .status(httpStatus.OK)
      .send({ message: "Products deleted successfully" });
  },
};

const multiDeleteProducts = {
  validation: {
    body: Joi.object().keys({
      ids: Joi.array().items(Joi.string().required()).required(),
    }),
  },
  handler: async (req, res) => {
    const { ids } = req.body;
    const parsedIds = typeof ids === "string" ? ids.split(",") : ids;

    if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No product IDs provided");
    }

    // Fetch products to remove their images
    const products = await Products.find({ _id: { $in: ids } });

    if (!products || products.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Products not found");
    }

    for (const product of products) {
      if (Array.isArray(product.image)) {
        for (const img of product.image) {
          if (img) await removeFile(img);
        }
      } else if (product.image) {
        await removeFile(product.image);
      }
    }

    // Remove associated images
    // for (const product of products) {
    //   if (product?.image) {
    //     await removeFile(product.image);
    //   }
    // }

    // Delete products from DB
    await Products.deleteMany({ _id: { $in: ids } });

    return res
      .status(httpStatus.OK)
      .send({ message: "Products deleted successfully" });
  },
};

const getSingleProduct = {
  validation: {
    params: Joi.object().keys({
      productId: Joi.string().required(), // Validate productId from params
    }),
  },
  handler: async (req, res) => {
    const { productId } = req.params;

    // Check if product exists
    const product = await Products.findById(productId);

    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    return res.status(httpStatus.OK).send(product);
  },
};

module.exports = {
  createProduct,
  getAllProducts,
  getTrendingProducts,
  updateProducts,
  deleteProduct,
  getBestSelling,
  getOnSale,
  getSingleProduct,
  multiDeleteProducts,
  getProductsByPrice,
};
