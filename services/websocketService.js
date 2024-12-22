const {
  MESSAGE_TYPES,
  ERROR_CODES,
  MESSAGE_ROLES,
  MODELS,
} = require('../config/constants');
const messageService = require('./messageService');
const redisService = require('./redisService');
const BotResponseOrchestrator = require('../utils/BotResponseOrchestrator');
const websocketConnectionManager = require('../utils/websocketConnectionManager');
const ChatHistoryManager = require('../utils/data/ChatHistoryManager');
const chatRepository = require('../utils/data/chatRepository');
const { handleRedisError } = require('../utils/errorHandlers');
const redisManager = require('../utils/redisManager');

const botResponseOrchestrator = new BotResponseOrchestrator();

const websocketService = {
  handleNewConnection: async (ws, userId) => {
    console.log('New WebSocket connection established');
    const socketId = ws.id; // Get the socket ID

    console.log(
      `Adding connection for user ${userId} with socket ID ${socketId}`
    );
    websocketConnectionManager.addConnection(userId, ws);

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
      console.log(
        `WebSocket connection closed for user ${userId} with socket ID ${socketId}`
      );
      websocketService.handleDisconnection(userId, socketId);
    });
  },

  handleMessage: async (ws, message) => {
    const user = ws.user;
    const userId = user.useruid;
    const { messageType, message: text, chatId, role } = message;

    console.log(`Handling message from user ${userId}:`, message);

    try {
      const redisKey = `bot_processing:${userId}:${chatId}`;
      const isBotProcessing = await redisManager.exists(redisKey);

      if (isBotProcessing) {
        console.log(
          `Bot is currently processing a message for ${userId}:${chatId}. Cancelling...`
        );

        // Signal cancellation to the BotResponseOrchestrator
        await botResponseOrchestrator.cancelResponse(userId, chatId);

        // Replace the last user message in the chat history
        await botResponseOrchestrator.replaceUserMessage(userId, chatId, text);

        // Update status for new message processing
        const statusSet = await redisManager.set(redisKey, Date.now());
        if (!statusSet) {
          throw new Error('Failed to set bot processing status in Redis');
        }
      }

      // Store the user message
      const userMessageResult = await messageService.storeMessage(
        userId,
        text,
        messageType,
        MESSAGE_ROLES.USER,
        chatId
      );
      const { chat: updatedChatUser } = userMessageResult;
      console.log(`Stored message from user ${userId} in the database`);

      // Handle bot response only if the message is intended for the bot
      if (role === 'user') {
        console.log(`Message is for bot, processing with bot controller`);

        // Process the message with the bot controller
        const chatHistoryManager = new ChatHistoryManager(
          updatedChatUser._id,
          chatRepository
        );

        // Get the formatted history for the model
        const history = await chatHistoryManager.buildHistory();

        const { botResponse, updatedChatBot } =
          await botResponseOrchestrator.generateResponse(
            userId,
            updatedChatUser._id,
            message,
            history
          );

        // Send the bot response back to the user, including chatId and chatname
        websocketService.sendMessage(userId, {
          type: MESSAGE_TYPES.TEXT,
          message: botResponse,
          role: MESSAGE_ROLES.BOT,
          chatId: updatedChatBot._id,
          chatname: updatedChatBot.chatname, // Include chatname
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      // Send error message to the user
      websocketService.sendMessage(userId, {
        type: 'error',
        code: error.code,
        message: error.message,
      });
      if (error.code === ERROR_CODES.CONSECUTIVE_USER_MESSAGE) {
      } else if (error.code === ERROR_CODES.EMPTY_MESSAGE) {
      } else {
        console.error('Unexpected error while handling message:', error);
      }
    }
  },

  handleDisconnection: async (userId, socketId) => {
    console.log(
      `Handling disconnection for user ${userId} with socket ID ${socketId}`
    );
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
            console.log(
              `Message sent to user ${userId} on socket ${socketId}:`,
              message
            );
          } else {
            console.warn(
              `WebSocket for user ${userId} on socket ${socketId} is not in OPEN state. Storing message in Redis.`
            );
            redisService.storeUnsentMessage(userId, message);
          }
        } catch (error) {
          console.error(
            `Error sending message to user ${userId} on socket ${socketId}:`,
            error
          );
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