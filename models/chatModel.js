// FILE: models/chatModel.js
// Updated chat model to remove agentState array from messages schema and enforce taskId rules.
const mongoose = require('mongoose');
const { MESSAGE_TYPES, MESSAGE_ROLES } = require('../config/config-constants');

const chatSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  chatname: {
    type: String,
    default: '',
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
      taskId: {
        type: String,
        default: null,
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

// Middleware to enforce taskId rules
chatSchema.pre('save', function (next) {
  this.messages.forEach((message) => {
    if (message.role !== MESSAGE_ROLES.USER) {
      message.taskId = null; // Force null for BOT or other roles
    }
  });
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
