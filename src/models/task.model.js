const { boolean, date } = require('joi');
const mongoose = require('mongoose');
const { toJSON } = require('./plugins');


const taskSchema = mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignments'
        },
        dueDate: {
            type: Date,
        },
        task: {
            type: String,
            require: true
        },
        assignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        description: {
            type: String,
            require: true
        },
        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps:true,
    }
)
taskSchema.plugin(toJSON);

/**
 * @typedef assignmentTask
 */
const assignmentTask = mongoose.model('assignment Task', taskSchema);

module.exports = assignmentTask;