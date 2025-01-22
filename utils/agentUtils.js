// I_BACKEND/utils/agentUtils.js
const redisManager = require('./redisManager');
const agentConfig = require('../config/config-agent');

const agentUtils = {
  getAgentConfig: async () => {
    const redisKey = 'agentConfig';
    try {
      // Try to get the config from Redis
      const cachedConfig = await redisManager.get(redisKey);
      if (cachedConfig) {
        console.log('Agent config found in Redis cache.');
        return JSON.parse(cachedConfig);
      } else {
        console.log(
          'Agent config not found in Redis cache. Reading from file.'
        );
        // Read config from file
        const agentConfig = require('../config/config-agent');

        // Cache the config in Redis with a TTL of 4 hours (14400 seconds)
        await redisManager.set(redisKey, JSON.stringify(agentConfig), {
          EX: 14400,
        });
        return agentConfig;
      }
    } catch (error) {
      console.error('Error getting agent config:', error);
      return null; // Handle error appropriately
    }
  },
};

module.exports = agentUtils;