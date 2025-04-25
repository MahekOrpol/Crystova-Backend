const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const todosSchema = mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Admin'
        },
        deadlinedate:{
            type:Date,
        },
        task:{
            type:String,
        },
        priority:{
            type:String,
        },
        description:{
            type:String,
        }
    },
    {
        timestamps:true,
    }
);

todosSchema.plugin(toJSON);

/**
 * @typedef ToDos
 */

const ToDos = mongoose.model('ToDos',todosSchema);
module.exports = ToDos;