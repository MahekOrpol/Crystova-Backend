const httpStatus = require("http-status");
const { Admin, Room } = require("../models");
const ApiError = require("../utils/ApiError");
const Joi = require("joi");
const mongoose = require('mongoose');

const createRoom = {
    validation: {
        body: Joi.object().keys({
            receiverId: Joi.string(),

        })
    },
    handler: async (req, res) => {
        console.log('req.user', req.body);
        const userData = await Room.findOne({
            $or: [
                {
                    senderId: req.user._id,
                    receiverId: req.body.receiverId
                },
                {
                    receiverId: req.user._id,
                    senderId: req.body.receiverId
                }
            ]
        })

        if (userData) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'Room already exists',
            });
        }
        const body = {
            ...req.body,
            senderId: req.user._id
        }
        const room = await new Room(body).save();
        return res.status(httpStatus.CREATED).send(room);
    }


};

const getRoom = {
    handler: async (req, res) => {
        const room = await Room.aggregate([
            {
                '$match': {
                    $or: [
                        {
                            senderId: req.user._id,
                        },
                        {
                            receiverId: req.user._id,
                        }
                    ]

                }
            }, {
                '$lookup': {
                    'from': 'admins',
                    'localField': 'senderId',
                    'foreignField': '_id',
                    'as': 'sender'
                }
            }, {
                '$unwind': {
                    'path': '$sender',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'admins',
                    'localField': 'receiverId',
                    'foreignField': '_id',
                    'as': 'receiver'
                }
            }, {
                '$unwind': {
                    'path': '$receiver',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'chats',
                    'let': {
                        'id': '$_id'
                    },
                    'pipeline': [
                        {
                            '$match': {
                                '$expr': {
                                    '$eq': [
                                        '$$id', '$roomId'
                                    ]
                                }
                            }
                        }, {
                            '$sort': {
                                'createdAt': -1
                            }
                        }
                    ],
                    'as': 'receiver_messager'
                }
            }, {
                '$project': {
                    'sender': 1,
                    'receiver': 1,
                    'createdAt': 1,
                    'block': 1,
                    'messager': {
                        '$arrayElemAt': [
                            '$receiver_messager', 0
                        ]
                    }
                }
            }
        ]);
        return res.status(httpStatus.OK).send(room);
    }
};

const updateBlockRoom = {
    validation: {
        body: Joi.object().keys({
            block: Joi.boolean()
        }),
    },
    handler: async (req, res, next) => {
        try {
            // const roomId = req.params.roomId; 
            const room = await Room.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
            // console.log('room', room);


            if (!room) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
            }

            room.blocked = true;
            await room.save();
            return res.status(httpStatus.OK).send({ message: 'Room blocked successfully' });
        } catch (error) {
            return next(error);
        }
    }
};

const getBlockRoom = {
    handler: async (req, res, next) => {
        // try {
        const room = await Room.find({ block: true, senderId: req?.user?.id }).populate("receiverId");
        // console.log(room,"blockRoom");

        // if (!room) {
        //     throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
        // }

        return res.status(httpStatus.OK).send(room);
        // } catch (error) {
        //     return next(error);
        // }
    }
};

const updateUnblockRoom = {
    validation: {
        body: Joi.object().keys({
            block: Joi.boolean()
        }),
    },
    handler: async (req, res, next) => {
        try {
            // const roomId = req.params.roomId; 
            const room = await Room.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true });
            if (!room) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
            }

            room.blocked = false;
            await room.save();

            return res.status(httpStatus.OK).send({ message: 'Room unblocked successfully' });
        } catch (error) {
            return next(error);
        }
    }
};

const deleteRoom = {
    handler: async (req, res) => {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(httpStatus.NOT_FOUND).send({
                message: 'Room not found',
            });
        }
        // console.log("hhjj", req.params.id);
        await Room.findByIdAndDelete(req.params.id);
        return res.status(httpStatus.OK).send({
            message: 'Room deleted successfully',
        });
    }
}

module.exports = {
    createRoom,
    getRoom,
    updateUnblockRoom,
    getBlockRoom,
    updateBlockRoom,
    deleteRoom
}