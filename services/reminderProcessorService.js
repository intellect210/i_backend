const { remindersStructure } = require('../config/config-structureDefinitions');
const { ERROR_CODES } = require('../config/config-constants');
const logger = require('../utils/helpers/logger');


const reminderProcessorService = {
    processReminder: async (reminderJson) => {
      try {
        logger.info(`[DEBUG]Processing reminder:`, reminderJson);

            const parsedReminder = JSON.parse(reminderJson);

            // Validate the structure against remindersStructure
            const { task } = parsedReminder;

            if (!task || typeof task !== 'object' || !task.taskDescription || !task.time) {
                // logger.warn(`Invalid reminder structure: ${reminderJson}`);
               return {
                    success: false,
                   message: 'Invalid reminder structure, missing taskDescription or time',
               };
            }

            const sanitizedReminder = task

        // logger.info(`Processed reminder successfully: ${JSON.stringify(sanitizedReminder)}`);
          return {
              success: true,
              sanitizedReminder: {task: sanitizedReminder},
          };
      } catch (error) {
        // logger.error(`Error processing reminder: ${error}`);
        return {
          success: false,
          message: error.message || 'Error processing reminder',
        };
      }
    },
};

module.exports = reminderProcessorService;