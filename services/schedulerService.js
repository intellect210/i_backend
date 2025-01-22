// FILE: services/schedulerService.js
const BullService = require('./bullService');
const Reminder = require('../models/reminderModel');
const {
  handleDatabaseError,
  handleRedisError,
} = require('../utils/helpers/error-handlers');
const { ERROR_CODES } = require('../config/config-constants');
const logger = require('../utils/helpers/logger');
const reminderProcessorService = require('./reminderProcessorService');
const { convertToBullOptions } = require('./job-options');

class SchedulerService {
  constructor() {
    this.bullService = new BullService();
  }

  async scheduleReminder(userId, task, options) {
    try {
      console.log('[DEBUG: task]', task);
      const processedReminder =
        await reminderProcessorService.processReminder(task);

      if (!processedReminder.success) {
        return {
          success: false,
          message: `Failed to process reminder: ${processedReminder.message}`,
        };
      }

      const { sanitizedReminder } = processedReminder;
      console.log('[DEBUG: sanitizedReminder]', sanitizedReminder);

      const jobData = {
        userId,
        taskDescription: sanitizedReminder.task.taskDescription,
        time: sanitizedReminder.task.time,
        recurrence: sanitizedReminder.task.recurrence,
        // Add other necessary data here
      };

      const bullOptions = convertToBullOptions(sanitizedReminder);

      console.log('[DEBUG: bullOptions]', bullOptions);

      const jobResult = await this.bullService.createJob(jobData, {
        ...options,
        ...bullOptions,
      });

       logger.debug(`[DEBUG: SchedulerService] jobResult after createJob: ${JSON.stringify(jobResult)}`);


      if (!jobResult.success) {
        return {
          success: false,
          message: `Failed to create job: ${jobResult.message}`,
        };
      }

      const reminder = new Reminder({
        userId,
        reminderId: jobResult.bullJobId,
        bullInternalJobId: jobResult.bullInternalJobId,
        taskDescription: sanitizedReminder.task.taskDescription,
        time: sanitizedReminder.task.time,
        recurrence: sanitizedReminder.task.recurrence,
        bullRepeatOptions: bullOptions.repeat,
          repeatJobKey: jobResult.repeatJobKey, // Store the repeatJobKey
      });

      await reminder.save();
      return {
        success: true,
        message: `Reminder scheduled successfully with job ID: ${jobResult.bullJobId}`,
        reminderId: jobResult.bullJobId,
      };
    } catch (error) {
      handleDatabaseError(
        error,
        error.code ? error.code : ERROR_CODES.DATABASE_ERROR,
        null,
        userId
      );
      return {
        success: false,
        message: error.message || 'Error scheduling reminder',
      };
    }
  }

 async dissolveReminder(reminderId) {
        try {
            const reminder = await Reminder.findOne({ reminderId: reminderId });
            if (!reminder) {
                logger.warn(`[DEBUG: schedulerService] Reminder not found in MongoDB for ID: ${reminderId}`);
                throw new Error('Reminder not found in MongoDB.');
            }

            let jobResult;

           if (reminder.repeatJobKey) {
              jobResult = await this.bullService.removeRepeatableJob(reminder.repeatJobKey, reminder.reminderId);
            } else {
               jobResult = await this.bullService.removeJob(reminder.bullInternalJobId);
            }

            if (!jobResult.success) {
                logger.warn(`[DEBUG: schedulerService] Failed to remove job with ID: ${reminderId} from redis: ${jobResult.message}`);
                throw new Error(jobResult.message);
            }

            const deletedReminder = await Reminder.findOneAndDelete({ reminderId: reminderId });
            if (!deletedReminder) {
                logger.warn(`[DEBUG: schedulerService] Reminder not found in MongoDB for ID: ${reminderId}`);
                throw new Error('Reminder not found in MongoDB.');
            }

            return {
                success: true,
                message: `Reminder deleted successfully.`,
            };
        } catch (error) {
            console.error('[DEBUG: schedulerService] Error dissolving reminder:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = SchedulerService;