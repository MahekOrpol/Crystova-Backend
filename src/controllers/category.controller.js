const httpStatus = require("http-status");
const Joi = require("joi");
const ApiError = require("../utils/ApiError");
const Category = require("../models/category.model");
const { saveFile, removeFile } = require("../utils/helper");

const createCategory = {
  validation: {
    body: Joi.object().keys({
      categoryName: Joi.string().required(),
      categoryImage: Joi.string().optional(),
    }),
  },
  handler: async (req, res) => {
    console.log("req.body :>> ", req.body);
    
    const { categoryName } = req.body;
    let categoryImage = req.file ? await saveFile(req.file) : null;

    // Check if category already exists
    const categoryExists = await Category.findOne({ categoryName });
    if (categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }

    // Create new category
    const category = new Category({ categoryName, categoryImage });
    await category.save();

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: "Category created successfully",
      data: {
        id: category._id,
        categoryName: category.categoryName,
        categoryImage: category.categoryImage || null,
        createdAt: category.createdAt,
      },
    });
  },
};

const getCategory = {
  handler: async (req, res) => {
    const categories = await Category.find();
    return res.status(httpStatus.OK).send(categories);
  },
};

const updateCategory = {
  handler: async (req, res) => {
    const { _id } = req.params;
    const { categoryName } = req.body;
    let categoryImage = req.file ? await saveFile(req.file) : null;

    const categoryExists = await Category.findOne({ _id });
    if (!categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    }

    // Prevent duplicate category names
    const duplicateCategory = await Category.findOne({
      categoryName,
      _id: { $ne: _id },
    });
    if (duplicateCategory) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category already exists");
    }

    // Remove old image if a new one is uploaded
    if (categoryImage && categoryExists.categoryImage) {
      await removeFile(categoryExists.categoryImage);
    }

    // Update category
    categoryExists.categoryName = categoryName || categoryExists.categoryName;
    categoryExists.categoryImage = categoryImage || categoryExists.categoryImage;
    await categoryExists.save();

    return res.status(httpStatus.OK).send(categoryExists);
  },
};

const deleteCategory = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const categoryExists = await Category.findOne({ _id });
    if (!categoryExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    }

    // Remove image if exists
    if (categoryExists.categoryImage) {
      await removeFile(categoryExists.categoryImage);
    }

    // Delete category
    await Category.deleteOne({ _id });
    return res.status(httpStatus.OK).send({ message: "Category deleted successfully" });
  },
};

module.exports = {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};
