const httpStatus = require('http-status');
const Joi = require('joi');
const { ToDos } = require('../models');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const createToDos = {
    validation: {
        body: Joi.object().keys({
            deadlinedate: Joi.date().required(),
            task: Joi.string().required(),
            priority: Joi.string().required(),
            description: Joi.string().required()
        }),
    },
    handler: async (req, res) => {
        const todostask = await ToDos.findOne({ task: req.body.task });
        // if (todostask) {
        //     throw new ApiError(httpStatus.BAD_REQUEST, 'Task already exits');
        // }     
        // console.log("req.body",req.user);
        const body = {
            ...req.body,
            userId: req.user._id
        }
        const todos = await new ToDos(body).save();
        return res.status(httpStatus.CREATED).send(todos);
    }
};

const updateToDos = {
    validation: {
        body: Joi.object().keys({
            deadlinedate: Joi.date(),
            task: Joi.string(),
            priority: Joi.string(),
            description: Joi.string()
        }),
    },
    handler: async (req, res) => {
        const todos = await ToDos.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.send(todos);
    }
};

const deleteToDos = {
    handler: async (req, res) => {
        await ToDos.findByIdAndDelete({ _id: req.params.id });
        return res.status(httpStatus.OK).send({
            message: "Delete Successfully"
        });
    }
};

const getToDos = {
    handler: async (req, res) => {
        const todos = await ToDos.find({ userId: req?.user?._id });
        return res.status(httpStatus.OK).send(todos);
    }
}

const getTodoTask = {
    handler: async (req, res) => {
        // const {priority} = req?.query;  
        // const filter = {};

        // if(priority){
        //     filter.priority = priority;
        // }

        const todos = await ToDos.find({ priority: req?.query?.priority });
        return res.status(httpStatus.OK).send(todos);
    }
}

module.exports = {
    createToDos,
    updateToDos,
    deleteToDos,
    getToDos,
    getTodoTask,
};