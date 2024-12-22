// FILE: services/redisService.js
const redisManager = require('../utils/redisManager');
const { ERROR_CODES } = require('../config/constants');

const redisService = {
  setUserSession: async (userId, socketId) => {
    try {
      console.log('Setting user session in Redis:', userId, socketId);
      const success = await redisManager.set(`user:${userId}`, socketId);
      if (!success) {
        throw new Error('Failed to set user session in Redis');
      }
    } catch (error) {
      console.error('Error setting user session in Redis:', error);
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  getUserSession: async (userId) => {
    try {
      return await redisManager.get(`user:${userId}`);
    } catch (error) {
      console.error('Error getting user session from Redis:', error);
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
      console.error('Error removing user session from Redis:', error);
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
      console.error('Error storing unsent message in Redis:', error);
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },

  getUnsentMessages: async (userId) => {
    try {
      const messages = await redisManager.get(`unsent:${userId}`);
      await redisManager.del(`unsent:${userId}`); // Clear the list after retrieving
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Error getting unsent messages from Redis:', error);
      throw { code: ERROR_CODES.REDIS_ERROR, message: error.message };
    }
  },
};

module.exports = redisService;