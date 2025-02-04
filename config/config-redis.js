// FILE: config/redisConfig.js
const redis = require('redis');
const logger = require('../utils/helpers/logger');
const config = require('./config-main');

const REDIS_URL = config.redisUri;

const redisClient = redis.createClient({
    url: REDIS_URL,
    retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis connection refused. Retrying...');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
            logger.error('Redis maximum retries reached');
            return new Error('Redis maximum retries reached');
        }
        // Retry after exponential backoff
        return Math.min(options.attempt * 100, 3000);
    }
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis Client Error', err));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        logger.error('Redis connection error:', error);
        throw error;
    }
};

module.exports = { 
    connectRedis, 
    redisClient,
    REDIS_URL 
};