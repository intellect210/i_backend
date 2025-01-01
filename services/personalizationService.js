const redisService = require('./redisService');
const Personalization = require('../models/personalizationModel');
const logger = require('../utils/logger');

class PersonalizationService {
  async getPersonalizationInfo(userId) {
    const redisKey = `personalization:${userId}`;

    try {
      // Try to get personalization info from Redis
      const cachedInfo = await redisService.getUserSession(redisKey);
      if (cachedInfo) {
        return JSON.parse(cachedInfo);
      }

      // If not found in Redis, fetch from MongoDB
      const personalizationInfo = await Personalization.findOne({ useruid: userId });
      if (personalizationInfo) {
        // Store in Redis for future use
        await redisService.setUserSession(redisKey, JSON.stringify(personalizationInfo));
        return personalizationInfo;
      } else {
        // Return default object if not found in MongoDB
        return {
          personalisedName: 'intellect',
          modelBehaviour: '',
          personalInfo: '',
        };
      }
    } catch (error) {
      logger.error('Error fetching personalization information:', error);
      // Return default object in case of error
      return {
        personalisedName: 'intellect',
        modelBehaviour: '',
        personalInfo: '',
      };
    }
  }
}

module.exports = PersonalizationService;