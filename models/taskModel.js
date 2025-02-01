// FILE: models/taskModel.js
// Updated task model to use agentState ids instead of status objects.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
    },
   plan: {
        type: String, // Store plan as a string
       required: true,
    },
    messageId: {
        type: String,
        default: null,
    },
    chatId: {
        type: String,
        default: null,
    },
    userId: {
        type: String,
        required: true,
    },
   executionStatus: [{
       type: mongoose.Schema.Types.ObjectId,
         ref: 'AgentState',
    }],
   createdAt: {
       type: Date,
       default: Date.now,
   }
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;