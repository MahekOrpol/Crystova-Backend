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
const Category = require("../models/category.model");

const createCategory = {
  validation: {
    body: Joi.object()
      .keys({
        categoryName: Joi.string().required(),
       
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
    const productsNameExits = await Category.findOne({
      categoryName: req.body.categoryName,
    });
   
    if (productsNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }
  
 
    const products = await new Category(req.body).save();
    return res.status(httpStatus.CREATED).send(products);
  },
};

const getCategory = {
    handler: async (req, res) => {
        const assignmentTask = await Category.find();
        return res.status(httpStatus.OK).send(assignmentTask);
    }

}

const updateProducts = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const productExits = await Category.findOne({ _id });
    if (!productExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    }

    // check if Products already exists
    const productsWithNameExits = await Category.findOne({
      categoryName: req.body?.categoryName,
      _id: { $ne: _id },
    }).exec();
    if (productsWithNameExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }

    // update Products
    const updateProducts = await Category.findOneAndUpdate({ _id }, req.body, {
      new: true,
    });
    return res.status(httpStatus.OK).send(updateProducts);
  },
};

const deleteProduct = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const productExits = await Category.findOne({ _id });
    if (!productExits) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    }

    // delete Products
    await Category.deleteOne({ _id });
    return res
      .status(httpStatus.OK)
      .send({ message: "Category deleted successfully" });
  },
};


module.exports = {
  createCategory,
  getCategory,
  updateProducts,
  deleteProduct,
};
