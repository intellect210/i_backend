// FILE: services/messageService.js
const Chat = require('../models/chatModel');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');

const messageService = {
  storeMessage: async (sender, message, messageType) => {
    console.log('storeMessage called with:', { sender, message, messageType });
    try {
      console.log('Creating new message');
      const newMessage = new Chat({ sender, message, messageType });
      console.log('Saving new message');
      await newMessage.save();
      console.log('Message saved successfully:', newMessage);
      return newMessage;
    } catch (error) {
      console.log('Error in storeMessage:', error);
      logger.error('Error storing message:', error);
      throw new Error(ERROR_CODES.DATABASE_ERROR);
    }
  },

  getChatHistory: async (user) => {
    console.log('getChatHistory called with user:', user);
    // implement it later when needed
  },
};

module.exports = messageService;