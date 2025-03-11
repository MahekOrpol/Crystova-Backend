const httpStatus = require('http-status');
const { authService, userService, tokenService, emailService } = require('../services');
const Joi = require('joi');
const { password } = require('../validations/custom.validation');
const ApiError = require('../utils/ApiError');
const { Admin } = require('../models');

const register = {
    validation: {
        body: Joi.object().keys({
            email: Joi.string().required().email(),
            password: Joi.string().required().custom(password),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            phone: Joi.string().required(),
        })
    },
    handler: async (req, res) => {
        const admin = await Admin.findOne({ email: req.body.email });
        if (admin) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'User already register');
        }
        const newAdmin = await new Admin(req.body).save();
        const token = await tokenService.generateAuthTokens(newAdmin);
        return res.status(httpStatus.CREATED).send({ token, admin:newAdmin });
    }
};

const login = {
    validation: {
        body: Joi.object().keys({
            email: Joi.string().required().email(),
            password: Joi.string().required(),
        })
    },
    handler: async (req, res) => {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.isPasswordMatch(password))) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect Email or Password')
        }
        
    const token = await tokenService.generateAuthTokens(admin);
    return res.status(httpStatus.OK).send({ token, admin });
    }
};

module.exports = {
    register,
    login,
};

