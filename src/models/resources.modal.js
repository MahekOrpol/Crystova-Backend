const mongoose = require('mongoose');
const { toJSON } = require('./plugins');


const resourcesShcema = mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        formate: {
            type: String,
        },
        file: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
);

resourcesShcema.plugin(toJSON);

/**
 * @typedef Resources
 */

const Resources = mongoose.model('Resources', resourcesShcema);
module.exports = Resources;