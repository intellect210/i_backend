// FILE: services/websocketService.js
const { MESSAGE_TYPES, ERROR_CODES } = require('../config/constants');
const messageService = require('./messageService');
const redisService = require('./redisService');
const botController = require('../controllers/botController');
const websocketConnectionManager = require('../utils/websocketConnectionManager');
// const logger = require('../utils/logger');

const websocketService = {
  handleNewConnection: async (ws, req) => {
    const user = ws.user;
    const userId = user.useruid;
    

    websocketConnectionManager.addConnection(userId, ws);
    await redisService.setUserSession(userId, ws);

    // Handle any unsent messages
    const unsentMessages = await redisService.getUnsentMessages(userId);
    if (unsentMessages.length > 0) {
      // logger.info(`Resending ${unsentMessages.length} unsent messages to user ${userId}`);
      console.log(`Resending ${unsentMessages.length} unsent messages to user ${userId}`);
      unsentMessages.forEach((message) => {
        websocketService.sendMessage(userId, message);
      });
    }

    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        await websocketService.handleMessage(ws, parsedMessage);
      } catch (error) {
        // logger.error('Error handling message:', error);
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      websocketService.handleDisconnection(userId, ws);
      // logger.info(`WebSocket connection closed for user ${userId}`);
      console.log(`WebSocket connection closed for user ${userId}`);
    });
  },

  handleMessage: async (ws, message) => {
    const user = ws.user;
    const userId = user.useruid;
    const { messageType, message: text } = message; // Assuming a { messageType, message } format

    // Store all messages in the database
    await messageService.storeMessage(userId, text, messageType);

    // Handle bot response
    if (message.receiver === 'bot') {
      // Process the message with the bot controller
      const botResponse = botController.handleBotResponse(message);

      // Store bot response in db
      await messageService.storeMessage("bot", botResponse, messageType);

      // Send the bot response back to the user
      websocketService.sendMessage(userId, {
        messageType: MESSAGE_TYPES.TEXT,
        message: botResponse,
        sender: 'bot',
      });
    }
    // no implementation if message is not for bot
  },

  handleDisconnection: async (userId, ws) => {
    websocketConnectionManager.removeConnection(userId);
    await redisService.removeUserSession(userId);
  },

  sendMessage: (userId, message) => {
    const ws = websocketConnectionManager.getConnection(userId);
    if (ws) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        // logger.error(`Error sending message to user ${userId}:`, error);
        console.error(`Error sending message to user ${userId}:`, error);
        // Store unsent message in Redis if sending fails
        redisService.storeUnsentMessage(userId, message);
      }
    } else {
      // logger.warn(`User ${userId} is not connected, storing message in Redis`);
      console.warn(`User ${userId} is not connected, storing message in Redis`);
      redisService.storeUnsentMessage(userId, message);
    }
  },
};

module.exports = websocketService;