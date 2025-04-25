const Joi = require("joi");
const { Chat, DiscussionChat } = require("../models");
const Message = require("../models/chat.model");
const httpStatus = require("http-status");

// const createChat = {
//     validation: {
//         body: Joi.object().keys({
//             receiverId:Joi.string(),
//             roomId:Joi.string(),
//             message:Joi.string()
//         })
//     },
//     handler: async (req, res) => {

//         // const message = new Message({
//         //     chatId, senderId, text
//         // });
//         //     const messages = await message.save();
//         //     res.status(200).json(messages)

//         const userData = await Chat.findOne({ roomId: req.body.roomId })

//         if (userData) {
//             return res.status(httpStatus.BAD_REQUEST).send({
//                 message: 'Room already exists',
//             });
//         }

//         const body = {
//             ...req.body,
//             senderId: req.user._id
//         }
//         const chat = await new Chat(body).save();
//         return res.status(httpStatus.CREATED).send(chat);

//     }
// }

const createDiscussionChat = {
    validation: {
        body: Joi.object().keys({
            discussionroomId: Joi.string().required(),
            message: Joi.string().required()
        })
    },
    handler: async (req, res) => {

        const body = {
            ...req.body,
            senderId: req.user._id
        }
        const discussionChat = await new DiscussionChat(body).save();
        return res.status(httpStatus.CREATED).send(discussionChat);
    }


};

const getDiscussionChat = {
    handler: async (req, res) => {
        if (!req.query?.discussionroomId) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'RoomId is Required',
            });
        }
        const discussionChat = await DiscussionChat.find({ discussionroomId: req.query.discussionroomId }).populate("senderId");
        return res.status(httpStatus.OK).send(discussionChat);
    }
}


module.exports = {
    createDiscussionChat,
    getDiscussionChat,
}