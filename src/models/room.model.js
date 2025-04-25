const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const roomSchema = mongoose.Schema(
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
        block: {
            type: Boolean,
            default: false 
        }
    },
    {
        timestamps: true,
    }
);

roomSchema.plugin(toJSON);

/**
 * @typedef Room
 */
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;