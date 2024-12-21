// FILE: models/chatModel.js
const mongoose = require('mongoose');
const { MESSAGE_TYPES, MESSAGE_ROLES } = require('../config/constants');

const chatSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  chatname: {
    type: String,
    default: 'older chat',
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
  },
  messages: [
    {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
      },
      text: {
        type: String,
        required: true,
      },
      messageType: {
        type: String,
        enum: Object.values(MESSAGE_TYPES),
        required: true,
      },
      role: {
        type: String,
        enum: Object.values(MESSAGE_ROLES),
        required: true,
      },
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed'],
        default: 'sent',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;