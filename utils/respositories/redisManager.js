// FILE: utils/redisManager.js
const { redisClient } = require('../../config/config-redis');
const { handleRedisError } = require('../helpers/error-handlers');
const { ERROR_CODES } = require('../../config/config-constants');

const redisManager = {
  async set(key, value, options = {}) {
    try {
      await redisClient.set(key, value, options);
      console.log(
        `Successfully set value for key: ${key} in Redis with options:`,
        options
      );
      return true;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
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
      //console.error(`Error getting value for key: ${key} from Redis:`, error);
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
      //console.error(`Error deleting key: ${key} from Redis:`, error);
      return false;
    }
  },

  async exists(key) {
    try {
      const exists = await redisClient.exists(key);
      console.log(`Successfully checked existence of key: ${key} in Redis`);
      return exists === 1;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      //console.error(
      // `Error checking existence of key: ${key} in Redis:`,
      // error
      // );
      return false;
    }
  },
  async rPush(key, value) {
    try {
      await redisClient.rPush(key, value);
      // console.log(`Successfully added value to list: ${key} in Redis`);
      return true;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      //console.error(`Error adding value to list: ${key} in Redis:`, error);
      return false;
    }
  },
  async lRange(key, start, stop) {
    try {
      const values = await redisClient.lRange(key, start, stop);
      console.log(`Successfully retrieved values from list: ${key} in Redis`);
      return values;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      //console.error(`Error retrieving values from list: ${key} in Redis:`, error);
      return [];
    }
  },
  async lPop(key) {
    try {
      const value = await redisClient.lPop(key);
      console.log(`Successfully retrieved value from list: ${key} in Redis`);
      return value;
    } catch (error) {
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      //console.error(`Error retrieving value from list: ${key} in Redis:`, error);
      return null;
    }
  },
};

module.exports = redisManager;