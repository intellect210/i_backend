// FILE: models/agentStateModel.js
// Updated agent state model to remove messageId
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agentStateSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  state: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
   taskId: {
       type: String,
       default: null,
   },
  errorMessage: {
    type: String,
  },
   sequence: {
      type: Number,
       required: true,
   },
});

const AgentState = mongoose.model('AgentState', agentStateSchema);

module.exports = AgentState;