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
    // ... (Existing code remains the same)
  }

  async dissolveReminder(reminderId, session) {
    try {
      const reminder = await Reminder.findOne({
        reminderId: reminderId,
      }).session(session);

      if (!reminder) {
        logger.warn(
          `[DEBUG: schedulerService] Reminder not found in MongoDB for ID: ${reminderId}`
        );
        throw new Error('Reminder not found in MongoDB.');
      }

      // Remove the job from Redis
      let jobResult;

      if (reminder.recurrence && reminder.recurrence.type !== 'once') {
        // Fetch the job from Bull to get the key
        const job = await this.bullService.getJob(reminderId);

        if (!job.success || !job.job) {
          const errorMessage = `[DEBUG: schedulerService] Job with ID: ${reminderId} not found in Redis or is invalid for dissolving`;
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }

        if (!job.job.opts || !job.job.opts.repeat || !job.job.opts.repeat.key) {
          logger.error(
            `[DEBUG: schedulerService] invalid job key for removing repeatable job with key: ${
              job.job.opts && job.job.opts.repeat
                ? job.job.opts.repeat.key
                : 'undefined'
            }`
          );
          throw new Error(
            `invalid job key for removing repeatable job with key: ${
              job.job.opts && job.job.opts.repeat
                ? job.job.opts.repeat.key
                : 'undefined'
            }`
          );
        }

        const isRemoved = await this.bullService.queue.removeRepeatableByKey(
          job.job.opts.repeat.key
        );

        if (!isRemoved) {
          logger.error(
            `[DEBUG: schedulerService] Failed to remove repeatable job with key: ${job.job.opts.repeat.key} `
          );
          throw new Error(
            `Failed to remove repeatable job with key: ${job.job.opts.repeat.key} `
          );
        } else {
          logger.info(
            `[DEBUG: schedulerService] Repeatable job with key: ${job.job.opts.repeat.key} removed successfully using its key`
          );
        }

        jobResult = {
          success: true,
          message: `Repeatable job with ID: ${job.job.opts.repeat.key} removed successfully using its key`,
        };
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