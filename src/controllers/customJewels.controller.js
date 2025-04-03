const Joi = require("joi");
const { CustomJewels } = require("../models");
const httpStatus = require("http-status");
const { saveFile } = require("../utils/helper");
const ApiError = require("../utils/ApiError");

const createCustomJewel = {
    validation: {
        body: Joi.object()
            .keys({
                name: Joi.string().required(),
                mobile: Joi.string().required(),
                email: Joi.string().required(),
                type: Joi.string().required(),
                budget: Joi.number().precision(2).required(),
                metal: Joi.string().required(),
                file: Joi.string().optional(),
                message: Joi.string().required()
            })
    },
    handler: async (req, res) => {
        try {
            const { name,email,mobile,metal,budget,message } = req.body;
            // Handle file upload if exists
            let filePath = null;
            if (req.files?.file) {
                const file = await saveFile(req.files.file);
                filePath = file?.upload_path || null;
            }
        
            // Check if CustomJewels already exists using specific fields
            const existingJewel = await CustomJewels.findOne({ name });
            if (existingJewel) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Custom jewelry with this name already exists");
            }
        
            // Create new CustomJewels
            const customJewels = await CustomJewels.create({ 
               name,
                file: filePath,email,mobile,metal,budget,message
            });
        
            return res.status(httpStatus.CREATED).json({
                success: true,
                message: "Custom jewelry created successfully",
                data:customJewels
            });
        } catch (error) {
            let statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            let errorMessage = "Error creating custom jewelry";
            
            if (error instanceof ApiError) {
                statusCode = error.statusCode;
                errorMessage = error.message;
            } else if (error.name === 'ValidationError') {
                statusCode = httpStatus.BAD_REQUEST;
                errorMessage = error.message;
            }
            
            return res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            });
        }
    }
}

module.exports = {
    createCustomJewel
}