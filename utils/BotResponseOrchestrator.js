// FILE: utils/BotResponseOrchestrator.js
const redisManager = require('./redisManager');
const botController = require('../controllers/botController');
const ChatHistoryManager = require('./data/ChatHistoryManager');
const chatRepository = require('./data/chatRepository');
const {
  handleBotResponseError,
  handleRedisError,
} = require('../utils/errorHandlers');
const { MESSAGE_TYPES, MESSAGE_ROLES, ERROR_CODES } = require('../config/constants');
const messageService = require('../services/messageService');

class BotResponseOrchestrator {
  async generateResponse(userId, chatId, message, history) {
    const redisKey = `bot_processing:${userId}:${chatId}`;
    const startTime = Date.now();

    try {
      // Store status in Redis
      const statusSet = await redisManager.set(redisKey, startTime);
      if (!statusSet) {
        throw new Error('Failed to set bot processing status in Redis');
      }
      console.log(`Bot response generation started for ${userId}:${chatId} at ${startTime}`);

      // Call botController to generate the response
      const botResponse = await botController.handleBotResponse(
        message,
        null,
        history
      );

      // Store bot response in db
      const botMessageResult = await messageService.storeMessage(
        userId,
        botResponse,
        MESSAGE_TYPES.TEXT,
        MESSAGE_ROLES.BOT,
        chatId
      );
      const { chat: updatedChatBot } = botMessageResult;
      console.log(`Stored bot response in the database`);

      // Upon completion, clear status from Redis
      const statusDeleted = await redisManager.del(redisKey);
      if (!statusDeleted) {
        console.error('Failed to clear bot processing status in Redis');
      }
      console.log(`Bot response generation completed for ${userId}:${chatId}`);

      return {
        botResponse,
        updatedChatBot,
      };
    } catch (error) {
      // Use centralized error handler with error code
      handleBotResponseError(error, ERROR_CODES.BOT_RESPONSE_ERROR, null, userId);

      // Clear status from Redis on error
      await redisManager.del(redisKey);
      console.error(`Bot response generation failed for ${userId}:${chatId}:`, error);
      throw error; // Re-throw the error after handling it
    }
  }

  async cancelResponse(userId, chatId) {
    const redisKey = `bot_processing:${userId}:${chatId}`;

    try {
      // Check if a response is being processed
      const isProcessing = await redisManager.exists(redisKey);

      if (isProcessing) {
        // Currently, we just clear the status.
        const statusDeleted = await redisManager.del(redisKey);
        if (!statusDeleted) {
          console.error('Failed to clear bot processing status in Redis');
        }
        console.log(`Bot response generation cancelled for ${userId}:${chatId}`);
        return true; // Indicate that cancellation was attempted
      } else {
        console.log(`No active bot response generation found for ${userId}:${chatId}`);
        return false; // Indicate that no cancellation was needed
      }
    } catch (error) {
      // Use centralized error handler with error code
      handleRedisError(error, ERROR_CODES.REDIS_ERROR, null, userId);
      console.error(`Error cancelling bot response for ${userId}:${chatId}:`, error);
      throw error; // Re-throw the error after handling it
    }
  }

  async replaceUserMessage(userId, chatId, newMessage) {
    try {
      const chatHistoryManager = new ChatHistoryManager(chatId, chatRepository);

      // Get the messages
      const messages = await chatHistoryManager.getMessages();
      if (messages.length > 0) {
        // Check if the last message is from the user
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === MESSAGE_ROLES.USER) {
          // Replace the last user message with the new message
          await chatHistoryManager.replaceMessage(
            messages.length - 1,
            newMessage,
            MESSAGE_ROLES.USER
          );
          console.log(`Replaced last user message in chat ${chatId} with new message`);
        } else {
          console.log(
            `Last message in chat ${chatId} is not from the user. No replacement needed.`
          );
        }
      } else {
        console.log(`Chat ${chatId} has no messages.`);
      }
    } catch (error) {
      console.error(`Error replacing user message in chat ${chatId}:`, error);
      throw error;
    }
  }
}

module.exports = BotResponseOrchestrator;