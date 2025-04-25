const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const eventSchema = mongoose.Schema(
    {
        Title:{
            type:String,
            required:true,
            trim:true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        StartDate: {
            type: String,
        },
        EndDate: {
            type: String,
        },
    },
    {
        timestamps:true,
    }
)
eventSchema.plugin(toJSON);
/**
 * @typedef EventData
 */
const EventData = mongoose.model('EventData', eventSchema);

module.exports = EventData;