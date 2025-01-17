const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const agentStateSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  message: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Chat.messages', // Reference to the subdocument
  },
  sequence: {
      type: Number,
      required: true,
  },
  state: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  errorMessage: {
    type: String,
  },
});

const AgentState = mongoose.model('AgentState', agentStateSchema);

module.exports = AgentState;