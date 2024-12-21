// FILE: services/websocketService.js
const { MESSAGE_TYPES, ERROR_CODES } = require('../config/constants');
const messageService = require('./messageService');
const redisService = require('./redisService');
const botController = require('../controllers/botController');
const websocketConnectionManager = require('../utils/websocketConnectionManager');
// const logger = require('../utils/logger');

const websocketService = {
  handleNewConnection: async (ws, userId, initialMessage) => {
    console.log('New WebSocket connection established');
    const socketId = ws.id; // Get the socket ID

    console.log(`Adding connection for user ${userId} with socket ID ${socketId}`);
    websocketConnectionManager.addConnection(userId, ws);

    // Store the socket ID in Redis, not the entire ws object
    await redisService.setUserSession(userId, socketId);
    console.log(`Stored user session in Redis for user ${userId}`);

    // Handle initial message (authentication details)
    if (initialMessage) {
      console.log(`Received initial message from user ${userId}:`, initialMessage);
      // Process initial message (e.g., store token, etc.)
      // You might want to store the token in the ws object for later use
      ws.token = initialMessage.token;
    }

    // Handle any unsent messages
    const unsentMessages = await redisService.getUnsentMessages(userId);
    if (unsentMessages.length > 0) {
      console.log(`Resending ${unsentMessages.length} unsent messages to user ${userId}`);
      unsentMessages.forEach((message) => {
        websocketService.sendMessage(userId, message);
      });
    }

    ws.on('message', async (message) => {
      console.log(`Received message from user ${userId}:`, message);
      try {
        const parsedMessage = JSON.parse(message);
        await websocketService.handleMessage(ws, parsedMessage);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket connection closed for user ${userId} with socket ID ${socketId}`);
      websocketService.handleDisconnection(userId, socketId);
    });
  },

  handleMessage: async (ws, message) => {
    const user = ws.user;
    const userId = user.useruid;
    const { messageType, message: text } = message; // Assuming a { messageType, message } format

    console.log(`Handling message from user ${userId}:`, message);

    // Store all messages in the database
    await messageService.storeMessage(userId, text, messageType);
    console.log(`Stored message from user ${userId} in the database`);

    // Handle bot response
    if (message.receiver === 'bot') {
      console.log(`Message is for bot, processing with bot controller`);
      // Process the message with the bot controller
      const botResponse = botController.handleBotResponse(message);

      // Store bot response in db
      await messageService.storeMessage("bot", botResponse, messageType);
      console.log(`Stored bot response in the database`);

      // Send the bot response back to the user
      websocketService.sendMessage(userId, {
        messageType: MESSAGE_TYPES.TEXT,
        message: botResponse,
        sender: 'bot',
      });
      console.log(`Sent bot response to user ${userId}`);
    }
    // no implementation if message is not for bot
  },

  handleDisconnection: async (userId, socketId) => {
    console.log(`Handling disconnection for user ${userId} with socket ID ${socketId}`);
    websocketConnectionManager.removeConnection(userId, socketId);
    await redisService.removeUserSession(userId);
    console.log(`Removed user session from Redis for user ${userId}`);
  },

  sendMessage: async (userId, message) => {
    console.log(`Sending message to user ${userId}:`, message);

    const userConnections = websocketConnectionManager.getConnection(userId);

    if (userConnections) {
      for (const [socketId, ws] of userConnections.entries()) {
        try {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
            console.log(`Message sent to user ${userId} on socket ${socketId}:`, message);
          } else {
            console.warn(`WebSocket for user ${userId} on socket ${socketId} is not in OPEN state. Storing message in Redis.`);
            redisService.storeUnsentMessage(userId, message);
          }
        } catch (error) {
          console.error(`Error sending message to user ${userId} on socket ${socketId}:`, error);
          redisService.storeUnsentMessage(userId, message);
        }
      }
    } else {
      console.warn(`User ${userId} is not connected, storing message in Redis`);
      redisService.storeUnsentMessage(userId, message);
    }
  },
};

module.exports = websocketService;