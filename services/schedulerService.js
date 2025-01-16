const BullService = require('./bullService');
const Reminder = require('../models/reminderModel');
const { handleDatabaseError } = require('../utils/errorHandlers');
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
            const processedReminder = await reminderProcessorService.processReminder(task);

            if (!processedReminder.success) {
                return {
                    success: false,
                    message: `Failed to process reminder: ${processedReminder.message}`,
                };
            }

            const { sanitizedReminder } = processedReminder;
            console.log("[DEBUG: sanitizedReminder]", sanitizedReminder);

            const jobData = {
                userId,
                taskDescription: sanitizedReminder.task.taskDescription,
                time: sanitizedReminder.task.time,
                recurrence: sanitizedReminder.task.recurrence,
                // Add other necessary data here
            };

            const bullOptions = convertToBullOptions(sanitizedReminder);

            console.log("[DEBUG: bullOptions]", bullOptions);

            const jobResult = await this.bullService.createJob(jobData, { ...options, ...bullOptions });

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
                reminderId: jobResult.jobId
            };

        } catch (error) {
            // logger.error('Error scheduling reminder:', error);
            handleDatabaseError(error, error.code ? error.code : ERROR_CODES.DATABASE_ERROR, null, userId);
            return {
                success: false,
                message: error.message || 'Error scheduling reminder',
            };
        }
    }

    async dissolveReminder(reminderId) {
        try {
            // logger.info(`Dissolving reminder with ID: ${reminderId}`);
            const jobResult = await this.bullService.removeJob(reminderId);
            if (!jobResult.success) {
                // logger.warn(`Failed to remove job with ID: ${reminderId}: ${jobResult.message}`);
                return {
                    success: false,
                    message: `Failed to remove job with ID: ${reminderId}: ${jobResult.message}`,
                };
            }

            const reminder = await Reminder.findOne({ reminderId: reminderId });
            if (reminder) {
                reminder.status = "cancelled";
                await reminder.save();
                // logger.info(`Reminder with ID: ${reminderId} cancelled in mongo`);
            }

            return {
                success: true,
                message: `Reminder with ID: ${reminderId} dissolved successfully`,
            };
        } catch (error) {
            // logger.error('Error dissolving reminder:', error);
            handleDatabaseError(error, error.code ? error.code : ERROR_CODES.DATABASE_ERROR);
            return {
                success: false,
                message: error.message || 'Error dissolving reminder',
            };
        }
    }


    onReminderCompleted(callback) {
        this.bullService.onCompleted(async (job) => {
            try {
                const reminder = await Reminder.findOne({ reminderId: job.id });
                if (reminder) {
                    reminder.status = "completed";
                    await reminder.save();
                    // logger.info(`Reminder with ID: ${job.id} marked completed`);
                }
                await callback(job);
            } catch (error) {
                // logger.error(`Error in onReminderCompleted callback for job ID ${job.id}:`, error);
            }
        });
    }


    onReminderFailed(callback) {
      this.bullService.onFailed(async (job, error) => {
        try {
           const reminder = await Reminder.findOne({ reminderId: job.id });
           if (reminder) {
             reminder.status = "failed";
             await reminder.save();
               logger.warn(`Reminder with ID: ${job.id} marked failed after retries.`, error);
          }
          await callback(job, error);
        } catch (callbackError) {
          // logger.error(`Error in onReminderFailed callback for job ID ${job.id}:`, callbackError);
        }
      });
    }
}

module.exports = SchedulerService;