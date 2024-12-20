// FILE: models/chatModel.js
const mongoose = require('mongoose');
const { MESSAGE_TYPES } = require('../config/constants');

const chatSchema = new mongoose.Schema({
  sender: {
    type: String, // user id who has sent the message
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: Object.values(MESSAGE_TYPES),
    default: MESSAGE_TYPES.TEXT,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;