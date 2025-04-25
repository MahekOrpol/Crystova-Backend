const httpStatus = require("http-status");
const { Admin, Room, DiscussionRoom } = require("../models");
const ApiError = require("../utils/ApiError");
const Joi = require("joi");
const mongoose = require('mongoose');

const createDiscussionRoom = {
    validation: {
        body: Joi.object().keys({
            senderId: Joi.string(),
            members: Joi.array().required(),
            assignmentId: Joi.string()
        })
    },
    handler: async (req, res) => {
        console.log('req.user', req.body);
        const body = {
            ...req.body,
            senderId: req.user._id
        }
        const discussionRoom = await new DiscussionRoom(body).save();
        return res.status(httpStatus.CREATED).send(discussionRoom);
    }

};

const getDiscussionRoom = {
    handler: async (req, res) => {
    
        const discussionRoom = await DiscussionRoom.findOne({ assignmentId: req?.query?.assignmentId }).populate("members");
        console.log('discussionRoom', discussionRoom)
        return res.status(httpStatus.OK).send(discussionRoom);
    }
};


module.exports = {
    createDiscussionRoom,
    getDiscussionRoom
}