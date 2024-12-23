// FILE: services/websocketService.txt
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
const { v4: uuidv4 } = require("uuid");

const botResponseOrchestrator = new BotResponseOrchestrator();
const botController = require('../controllers/botController');

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

  handleStream: async (streamId, chatId, chunk, isStreamEnd, ws) => {
    const userId = ws.user.useruid;

    try {
      if (!isStreamEnd) {
        // Store chunk in Redis with chatId
        await redisService.storeChunk(streamId, chatId, chunk);
  
        // Send chunk to client
        websocketService.sendMessage(userId, {
          type: MESSAGE_TYPES.CHUNK,
          streamId: streamId,
          chatId: chatId,
          message: chunk,
        });
      } else {
        // End of stream
        // Retrieve and combine chunks from Redis
        const fullMessage = await redisService.combineChunks(
          streamId,
          chatId
        );
  
        // Store full message in MongoDB using the correct chatId
        const botMessageResult = await messageService.storeMessage(
          userId,
          fullMessage,
          MESSAGE_TYPES.TEXT,
          MESSAGE_ROLES.BOT,
          chatId // Use the chatId passed to the function
        );
  
        // Send end of stream message to client
        websocketService.sendMessage(userId, {
          type: MESSAGE_TYPES.CHUNK_END,
          streamId: streamId,
          chatId: chatId,
        });
  
        // Remove chunks from Redis
        await redisService.deleteChunks(streamId, chatId);
      }
    } catch (error) {
      console.error("Error handling stream:", error);
      let errorCode = "STREAM_ERROR";
  
      if (error.code) {
        errorCode = error.code;
      } else if (error.name) {
        errorCode = error.name;
      }
      websocketService.sendMessage(userId, {
        type: MESSAGE_TYPES.ERROR,
        streamId,
        chatId,
        code: errorCode,
        message: error.message || "An error occurred during streaming.",
      });
    }
  },

  handleStreamError: async (streamId, chatId, errorCode, errorMessage, ws) => {
    const userId = ws.user.useruid;
    console.error(
      `Error in stream ${streamId} for chat ${chatId}: ${errorCode} - ${errorMessage}`
    );

    // Send error message to client
    websocketService.sendMessage(userId, {
      type: MESSAGE_TYPES.ERROR,
      streamId,
      chatId,
      code: errorCode,
      message: errorMessage || "An error occurred during streaming.",
    });

    // Potentially clean up any partial data in Redis related to the streamId and chatId.
    try {
      await redisService.deleteChunks(streamId, chatId);
    } catch (cleanupError) {
      console.error(
        `Error cleaning up Redis chunks for stream ${streamId} and chat ${chatId}:`,
        cleanupError
      );
    }
  },

  handleMessage: async (ws, message) => {
    const user = ws.user;
    const userId = user.useruid;
    let { messageType, message: text, chatId, role } = message;

    console.log(`Handling message from user ${userId}:`, message);

    try {
      // Store the user message and get the updated chat
      const userMessageResult = await messageService.storeMessage(
        userId,
        text,
        messageType,
        MESSAGE_ROLES.USER,
        chatId // This may be null or an existing chatId
      );
      const { chat: updatedChatUser } = userMessageResult;

      // Use the returned chatId (either existing or new)
      chatId = updatedChatUser._id.toString();

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
      // const userMessageResult = await messageService.storeMessage(
      //   userId,
      //   text,
      //   messageType,
      //   MESSAGE_ROLES.USER,
      //   chatId
      // );
      // const { chat: updatedChatUser } = userMessageResult;
      // console.log(`Stored message from user ${userId} in the database`);

      // Handle bot response only if the message is intended for the bot
      if (role === 'user') {
        console.log(`Message is for bot, processing with bot controller`);

        const chatHistoryManager = new ChatHistoryManager(
          updatedChatUser._id,
          chatRepository
        );
        const history = await chatHistoryManager.buildHistory();

        // Pass updated chatId to streamBotResponse
        await botController.streamBotResponse(
          { ...message, chatId }, // Pass chatId to the bot controller
          null,
          history,
          ws,
          websocketService.handleStream,
          websocketService.handleStreamError
        );
      }
    } catch (error) {
      console.error('Error handling message:', error);
      websocketService.sendMessage(userId, {
        type: 'error',
        code: error.code,
        message: error.message,
      });
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