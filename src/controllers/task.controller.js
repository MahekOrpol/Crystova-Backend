const httpStatus = require('http-status');
const Joi = require('joi');
const { ToDos, Task } = require('../models');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const createTask = {
    validation: {
        body: Joi.object().keys({
            dueDate: Joi.date().required(),
            task: Joi.string().required(),
            description: Joi.string().required(),
            assignId: Joi.string().required(),
            assignmentId: Joi.string().required(),

        }),
    },
    handler: async (req, res) => {
        const assignmentExist = await Task.findOne({ assignmentId: req.body.assignmentId, task: req.body.task })

        if (assignmentExist) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'task already exists',
            });
        }

        const assignmentTask = await new Task(req.body).save();
        return res.status(httpStatus.CREATED).send(assignmentTask);
    }
};

const updateTask = {
    validation: {
        body: Joi.object().keys({
            dueDate: Joi.date(),
            task: Joi.string(),
            description: Joi.string(),
            assignId: Joi.string(),
            assignmentId: Joi.string(),
            isCompleted : Joi.boolean()

        }),
    },
    handler: async (req, res) => {
        const task = await Task.findOne({ _id: req.params.id })
        if (!task) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'Task Not Found',
            });
        }
        await Task.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
        
        return res.send({ message: "Task update successfully" });
    }
}

const getTask = {
    handler: async (req, res) => {
        const assignmentTask = await Task.find({assignmentId:req.query.assignmentId});
        return res.status(httpStatus.OK).send(assignmentTask);
    }

}

const deleteTask = {
    handler: async (req, res) => {
        const assignmentTask = await Task.findById(req.params.id);
        if (!assignmentTask) {
            return res.status(httpStatus.NOT_FOUND).send({
                message: 'Task not found',
            });
        }
        // console.log("hhjj", req.params.id);
        await Task.findByIdAndDelete(req.params.id);
        return res.status(httpStatus.OK).send({
            message: 'Task deleted successfully',
        });
    }
};


module.exports = {
    createTask,
    updateTask,
    getTask,
    deleteTask
}