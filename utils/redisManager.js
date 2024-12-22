// FILE: utils/redisManager.js
const { redisClient } = require('../config/redisConfig');
const { handleRedisError } = require('./errorHandlers');
const { ERROR_CODES } = require('../config/constants');

const redisManager = {
  async set(key, value) {
    try {
      await redisClient.set(key, value);
      console.log(`Successfully set value for key: ${key} in Redis`);
      return true;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      console.error(`Error setting value for key: ${key} in Redis:`, error);
      return false;
    }
  },

  async get(key) {
    try {
      const value = await redisClient.get(key);
      console.log(`Successfully retrieved value for key: ${key} from Redis`);
      return value;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      console.error(`Error getting value for key: ${key} from Redis:`, error);
      return null;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      console.log(`Successfully deleted key: ${key} from Redis`);
      return true;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      console.error(`Error deleting key: ${key} from Redis:`, error);
      return false;
    }
  },

  async exists(key) {
    try {
      const exists = await redisClient.exists(key);
      console.log(
        `Successfully checked existence of key: ${key} in Redis`
      );
      return exists === 1;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      console.error(
        `Error checking existence of key: ${key} in Redis:`,
        error
      );
      return false;
    }
  },
};

module.exports = redisManager;