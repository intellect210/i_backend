const Queue = require('bull');
const { redisClient } = require('../config/redisConfig');
const { handleRedisError } = require('../utils/errorHandlers');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const Reminder = require('../models/reminderModel');

class BullService {
  constructor() {
    this.queue = new Queue('reminderQueue', {
      redis: {
        client: redisClient,
      },
      defaultJobOptions: {
        removeOnComplete: true, // Remove jobs on completion
        attempts: 3, // Max number of attempts
        backoff: {
          type: 'exponential',
          delay: 1000, // Initial delay of 1 second (can increase with 'exponential' type)
        },
      },
    });

    this.queue.on('error', (error) => {
      logger.error(`Bull queue error:`, error);
    });

    this.queue.on('completed', async (job) => {
      try {
        // Update MongoDB with new job key if job is completed
        await this.updateReminderJobId(job.id, job.returnvalue?.jobId); // Assuming returnvalue has new jobId
        logger.info(
          `Job completed with ID: ${job.id} removed from queue. New job ID: ${job.returnvalue?.jobId}`
        );
      } catch (error) {
        logger.error(
          `Error updating job ID for completed job ${job.id}:`,
          error
        );
      }
    });

    this.queue.on('failed', async (job, error) => {
      try {
        if (job.attemptsMade >= job.opts.attempts) {
          // Update MongoDB with new job key if job failed after all attempts
          await this.updateReminderJobId(job.id, job.failedReason?.jobId); // Assuming failedReason has new jobId
          logger.warn(
            `Job failed with ID: ${job.id}, error: ${error}. Retries exhausted, marking as failed. New job ID: ${job.failedReason?.jobId}`
          );
        }
      } catch (callbackError) {
        logger.error(
          `Error updating job ID for failed job ${job.id}:`,
          callbackError
        );
      }
    });
  }

  async createJob(jobData, options) {
    try {
      const jobId = uuidv4();
      const job = await this.queue.add(jobData, { ...options, jobId });
      logger.info(`Job created with ID: ${job.id}`);
      return {
        success: true,
        jobId: job.id,
        message: `Job created with ID: ${job.id}`,
      };
    } catch (error) {
      logger.error('Error creating job:', error);
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      return {
        success: false,
        message: error.message || 'Error creating job',
      };
    }
  }

  async getJob(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        logger.warn(`Job not found with ID: ${jobId}`);
        return {
          success: false,
          message: `Job not found with ID: ${jobId}`,
        };
      }
      logger.info(`Job retrieved with ID: ${jobId}`);
      return {
        success: true,
        job,
      };
    } catch (error) {
      logger.error('Error getting job:', error);
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      return {
        success: false,
        message: error.message || 'Error getting job',
      };
    }
  }

  async removeJob(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        logger.warn(`Job not found with ID: ${jobId}, cannot remove`);
        return {
          success: false,
          message: `Job not found with ID: ${jobId}, cannot remove`,
        };
      }
      await job.remove();
      logger.info(`Job removed with ID: ${jobId}`);
      return {
        success: true,
        message: `Job removed with ID: ${jobId}`,
      };
    } catch (error) {
      logger.error('Error removing job:', error);
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      return {
        success: false,
        message: error.message || 'Error removing job',
      };
    }
  }

  async updateJob(jobId, updateData) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        logger.warn(`Job not found with ID: ${jobId}, cannot update`);
        return {
          success: false,
          message: `Job not found with ID: ${jobId}, cannot update`,
        };
      }
      await job.update(updateData);
      logger.info(`Job updated with ID: ${jobId}`);
      return {
        success: true,
        message: `Job updated with ID: ${jobId}`,
      };
    } catch (error) {
      logger.error('Error updating job:', error);
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      return {
        success: false,
        message: error.message || 'Error updating job',
      };
    }
  }

  async getQueueState() {
    try {
      const counts = await this.queue.getJobCounts();
      logger.info('Queue state retrieved.');
      return {
        success: true,
        counts,
      };
    } catch (error) {
      logger.error('Error getting queue state:', error);
      handleRedisError(error, ERROR_CODES.REDIS_ERROR);
      return {
        success: false,
        message: error.message || 'Error getting queue state',
      };
    }
  }
  
  // Called in onComplete and onFailed, abstracted logic into it
  async updateReminderJobId(oldJobId, newJobId) {
    if (newJobId && oldJobId !== newJobId) {
      const reminder = await Reminder.findOne({ reminderId: oldJobId });
      if (reminder) {
        reminder.reminderId = newJobId;
        await reminder.save();
        logger.info(
          `Updated reminder in MongoDB. Old job ID: ${oldJobId}, New job ID: ${newJobId}`
        );
      }
    }
  }

  async removeRepeatableJob(jobId) {
    try {
      const jobs = await this.queue.getRepeatableJobs();
      const jobToBeDeleted = jobs.find((job) => job.id === jobId || job.key.includes(jobId));

      if (!jobToBeDeleted) {
        logger.error(`[DEBUG: bullService] Failed to find repeatable job with ID: ${jobId}`);
        throw new Error(`Failed to find repeatable job with ID: ${jobId}`);
      }

      const isRemoved = await this.queue.removeRepeatableByKey(jobToBeDeleted.key);
      if (!isRemoved) {
        logger.error(`[DEBUG: bullService] Failed to remove repeatable job with ID: ${jobId}`);
        throw new Error(`Failed to remove repeatable job with ID: ${jobId}`);
      }

      logger.info(`[DEBUG: bullService] Repeatable job with ID: ${jobId} removed successfully`);
      return {
        success: true,
        message: `Repeatable job with ID: ${jobId} removed successfully`,
      };
    } catch (error) {
      logger.error(`[DEBUG: bullService] Error removing repeatable job with ID: ${jobId}`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = BullService;