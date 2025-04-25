const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const chatSchema = mongoose.Schema(
    {
        senderId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Admin',
        },
        receiverId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Admin',
            required:true,
        },
        message:{
            type:String,    
            required:true,
        },
        roomId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Room',
            required:true,
        },
    },
    {
        timestamps: true,
    }
);

chatSchema.plugin(toJSON);

/**
 * @typedef Chat
 */
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;