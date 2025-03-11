const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const discussionRoomSchema = mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment"
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        }],

    },
    {
        timestamps: true,
    }
);

discussionRoomSchema.plugin(toJSON);

/**
 * @typedef DiscussionRoom
 */
const DiscussionRoom = mongoose.model('DiscussionRoom', discussionRoomSchema);

module.exports = DiscussionRoom;