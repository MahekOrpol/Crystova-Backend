const Joi = require("joi");

const httpStatus = require("http-status");
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const EventData = require("../models/event.model");


const createEvent = {
    validation: {
        body: Joi.object().keys({
            Title: Joi.string().required(),
            StartDate: Joi.string().required(),
            EndDate: Joi.string().required(),
        })
    },
    handler: async (req, res) => {
        console.log(req.body, "req.body");
        // const eventData = await EventData.findOne({ StartDate: req.body.StartDate })

        // if (eventData) {
        //     return res.status(httpStatus.BAD_REQUEST).send({
        //         message: 'Start Date Already Exists'
        //         ,
        //     });
        // }

        const body = {
            ...req.body,
            userId: req.user._id
        }
        const eventDatas = await new EventData(body).save();
        return res.status(httpStatus.CREATED).send(eventDatas);
    }
}

const getEvent = {
    handler: async (req, res) => {
        const eventDatas = await EventData.find({ userId: req?.user?._id });
        return res.status(httpStatus.OK).send(eventDatas);
    }
}

const updateEvent = {
    validation: {
        body: Joi.object().keys({
            Title: Joi.string().required(),
            StartDate: Joi.string().required(),
            EndDate: Joi.string().required(),
        })
    },
    handler: async (req, res) => {
        const eventDatas = await EventData.findOne({ _id: req.params.id })
        if (!eventDatas) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'event Not Found',
            });
        }
        await EventData.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return res.send({ message: "event update successfully" });
    }
}

module.exports = {
    createEvent,
    getEvent,
    updateEvent,
}