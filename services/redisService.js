// FILE: services/redisService.txt
// FILE: services/redisService.js
const redisManager = require('../utils/redisManager');
const { ERROR_CODES } = require('../config/config-constants');

const redisService = {
  setUserSession: async (userId, socketId) => {
    try {
      console.log('Setting user session in Redis:', userId, socketId);
      const success = await redisManager.set(`user:${userId}`, socketId, { EX: 600 }); // Set TTL to 10 minutes
      if (!success) {
        throw new Error('Failed to set user session in Redis');
      }
    } catch (error) {
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  getUserSession: async (userId) => {
    try {
      return await redisManager.get(`user:${userId}`);
    } catch (error) {
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  removeUserSession: async (userId) => {
    try {
      const success = await redisManager.del(`user:${userId}`);
      if (!success) {
        throw new Error('Failed to remove user session from Redis');
      }
      console.log('User session removed for userId:', userId);
    } catch (error) {
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  storeUnsentMessage: async (userId, message) => {
    try {
      const success = await redisManager.set(`unsent:${userId}`, JSON.stringify(message));
      if (!success) {
        throw new Error('Failed to store unsent message in Redis');
      }
    } catch (error) {
      //console.error('Error storing unsent message in Redis:', error);
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  getUnsentMessages: async (userId) => {
    try {
      const messages = await redisManager.get(`unsent:${userId}`);
      await redisManager.del(`unsent:${userId}`); // Clear the list after retrieving
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      //console.error('Error getting unsent messages from Redis:', error);
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  storeChunk: async (streamId, chatId, chunk) => {
    const key = `stream:${streamId}:${chatId}`;
    try {
      await redisManager.rPush(key, chunk);
      // console.log(`Stored chunk for stream ${streamId}:chat ${chatId} in Redis`);
    } catch (error) {
      //console.error(`Error storing chunk for stream ${streamId} in Redis:`, error);
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  combineChunks: async (streamId, chatId) => {
    const key = `stream:${streamId}:${chatId}`;
    try {
      const chunks = await redisManager.lRange(key, 0, -1);
      console.log(`Retrieved chunks for stream ${streamId}:chat ${chatId} from Redis`);
      return chunks.join("");
    } catch (error) {
      //console.error(
      //   `Error retrieving chunks for stream ${streamId} from Redis:`,
      //   error
      // );
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  deleteChunks: async (streamId, chatId) => {
    const key = `stream:${streamId}:${chatId}`;
    try {
      await redisManager.del(key);
      console.log(`Deleted chunks for stream ${streamId}:chat ${chatId} from Redis`);
    } catch (error) {
      //console.error(
      //   `Error deleting chunks for stream ${streamId} from Redis:`,
      //   error
      // );
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },
};

module.exports = redisService;