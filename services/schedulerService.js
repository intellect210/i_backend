// FILE: services/schedulerService.txt
const BullService = require('./bullService');
const Reminder = require('../models/reminderModel');
const {
  handleDatabaseError,
  handleRedisError,
} = require('../utils/errorHandlers');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');
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

      if (!jobResult.success) {
        // logger.error(`Failed to create job for user ${userId}`, jobResult.message);
        return {
          success: false,
          message: `Failed to create job: ${jobResult.message}`,
        };
      }

      const reminder = new Reminder({
        userId,
        reminderId: jobResult.jobId,
        taskDescription: sanitizedReminder.task.taskDescription,
        time: sanitizedReminder.task.time,
        recurrence: sanitizedReminder.task.recurrence,
      });

      await reminder.save();
      // logger.info(`Reminder scheduled successfully for user ${userId} with job ID: ${jobResult.jobId}`);
      return {
        success: true,
        message: `Reminder scheduled successfully with job ID: ${jobResult.jobId}`,
        reminderId: jobResult.jobId,
      };
    } catch (error) {
      // logger.error('Error scheduling reminder:', error);
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

  async dissolveReminder(reminderId, session) {
    try {
      const reminder = await Reminder.findOne({ reminderId: reminderId }).session(session);
      // Remove the job from Redis
      let jobResult;

      if (reminder.recurrence && reminder.recurrence.type !== 'once') {
        jobResult = await this.bullService.removeRepeatableJob(reminderId);
      } else {
        jobResult = await this.bullService.removeJob(reminderId);
      }

      if (!jobResult.success) {
        logger.warn(
          `[DEBUG: schedulerService] Failed to remove job with ID: ${reminderId} from redis: ${jobResult.message}`
        );
        throw new Error(jobResult.message);
      }

      // Delete the reminder from MongoDB
      const deletedReminder = await Reminder.findOneAndDelete(
        { reminderId: reminderId },
        { session }
      );

      if (!deletedReminder) {
        logger.warn(
          `[DEBUG: schedulerService] Reminder not found in MongoDB for ID: ${reminderId}`
        );
        throw new Error('Reminder not found in MongoDB.');
      }

      return {
        success: true,
        message: `Reminder deleted successfully.`,
      };
    } catch (error) {
      console.error(
        '[DEBUG: schedulerService] Error dissolving reminder:',
        error
      );
      throw error;
    }
  }
  
}

module.exports = SchedulerService;