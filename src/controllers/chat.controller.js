const Joi = require("joi");
const { Chat } = require("../models");
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

const createChat = {
    validation: {
        body: Joi.object().keys({
            receiverId: Joi.string().required(),
            roomId: Joi.string().required(),
            message: Joi.string()
        })
    },
    handler: async (req, res) => {
        console.log('req.user', req.body);

        const body = {
            ...req.body,
            senderId: req.user._id
        }
        const chat = await new Chat(body).save();
        return res.status(httpStatus.CREATED).send(chat);
    }


};

const getChat = {
    handler: async (req, res) => {
        if (!req.query?.roomId) {
            return res.status(httpStatus.BAD_REQUEST).send({
                message: 'RoomId is Required',
            });
        }
        const chat = await Chat.find({ roomId: req.query.roomId }).populate(['receiverId', 'senderId']);

        console.log(chat, 'chat')
        return res.status(httpStatus.OK).send(chat);
    }
}

const deleteChat = {
    handler: async (req, res) => {
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(httpStatus.NOT_FOUND).send({
                message: 'Chat not found',
            });
        }
        // console.log("hhjj", req.params.id);
        await Chat.findByIdAndDelete(req.params.id);
        return res.status(httpStatus.OK).send({
            message: 'Chat deleted successfully',
        });
    }
}

module.exports = {
    createChat,
    getChat,
    deleteChat
}