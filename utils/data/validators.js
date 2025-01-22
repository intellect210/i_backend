// FILE: utils/data/validators.js
const { MESSAGE_TYPES, MESSAGE_ROLES } = require('../../config/config-constants');

const validators = {
  isValidMessageType: (type) => {
    return Object.values(MESSAGE_TYPES).includes(type);
  },

  isEmptyMessage: (message) => {
    return !message || message.trim().length === 0;
  },

  isConsecutiveUserMessage: (chat, newRole) => {
    if (!chat || !chat.messages || chat.messages.length === 0) {
      return false;
    }
    const lastMessage = chat.messages.slice(-1)[0];
    return lastMessage.role === newRole && newRole === MESSAGE_ROLES.USER;
  },
};

module.exports = validators;