// FILE: services/redisService.js
const { redisClient } = require('../config/redisConfig');
const { ERROR_CODES } = require('../config/constants');
// const logger = require('../utils/logger');

const redisService = {
  setUserSession: async (userId, socketId) => {
    try {
      await redisClient.set(`user:${userId}`, socketId);
    } catch (error) {
      // logger.error('Error setting user session in Redis:', error);
      console.error('Error setting user session in Redis:', error);
      throw new Error(ERROR_CODES.REDIS_ERROR);
    }
  },

  getUserSession: async (userId) => {
    try {
      return await redisClient.get(`user:${userId}`);
    } catch (error) {
      // logger.error('Error getting user session from Redis:', error);
      console.error('Error getting user session from Redis:', error);
      throw new Error(ERROR_CODES.REDIS_ERROR);
    }
  },

  removeUserSession: async (userId) => {
    try {
      await redisClient.del(`user:${userId}`);
      console.log('User session removed for userId:', userId);
    } catch (error) {
      // logger.error('Error removing user session from Redis:', error);
      console.error('Error removing user session from Redis:', error);
      throw new Error(ERROR_CODES.REDIS_ERROR);
    }
  },

  storeUnsentMessage: async (userId, message) => {
    try {
      await redisClient.rPush(`unsent:${userId}`, JSON.stringify(message));
    } catch (error) {
      // logger.error('Error storing unsent message in Redis:', error);
      console.error('Error storing unsent message in Redis:', error);
      throw new Error(ERROR_CODES.REDIS_ERROR);
    }
  },

  getUnsentMessages: async (userId) => {
    try {
      const messages = await redisClient.lRange(`unsent:${userId}`, 0, -1);
      await redisClient.del(`unsent:${userId}`); // Clear the list after retrieving
      return messages.map((message) => JSON.parse(message));
    } catch (error) {
      // logger.error('Error getting unsent messages from Redis:', error);
      console.error('Error getting unsent messages from Redis:', error);
      throw new Error(ERROR_CODES.REDIS_ERROR);
    }
  },
};

module.exports = redisService;