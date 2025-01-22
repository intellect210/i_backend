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
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.queue.on('error', (error) => {
      logger.error(`Bull queue error:`, error);
    });

    this.queue.on('completed', async (job) => {
      try {
        await this.updateReminderJobId(job.id, job.returnvalue?.jobId);
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
          await this.updateReminderJobId(job.id, job.failedReason?.jobId);
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
        let job;
        try {
            const bullJobId = uuidv4();
            job = await this.queue.add(jobData, { ...options, jobId: bullJobId });
            logger.info(`Job created with Bull internal ID: ${job.id}, our Bull Job ID: ${bullJobId}`);
            logger.debug(`[DEBUG: BullService] Job object: ${JSON.stringify(job)}`);
            logger.debug(`[DEBUG: BullService] repeatJobKey: ${job.repeatJobKey}`);
            console.log(`[DEBUG: BullService] repeatJobKey: ${job.repeatJobKey}`);
  

            return {
                success: true,
                bullJobId: bullJobId,
                bullInternalJobId: job.id,
                repeatJobKey: job.repeatJobKey,
                message: `Job created with Bull internal ID: ${job.id}, our Bull Job ID: ${bullJobId}`,
            };
        } catch (error) {
            logger.error('Error creating job:', error);
             logger.error(`[DEBUG: BullService] Error creating job: ${error}`);
            handleRedisError(error, ERROR_CODES.REDIS_ERROR);
            return {
                success: false,
                message: error.message || 'Error creating job',
            };
        }
    }


  async getJob(bullJobId) {
    try {
      const job = await this.queue.getJob(bullJobId);
      if (!job) {
        logger.warn(`Job not found with Bull internal ID: ${bullJobId}`);
        return {
          success: false,
          message: `Job not found with Bull internal ID: ${bullJobId}`,
        };
      }
      logger.info(`Job retrieved with Bull internal ID: ${bullJobId}`);
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

  async removeJob(bullJobId) {
    try {
      const job = await this.queue.getJob(bullJobId);
      if (!job) {
        logger.warn(`Job not found with Bull internal ID: ${bullJobId}, cannot remove`);
        return {
          success: false,
          message: `Job not found with Bull internal ID: ${bullJobId}, cannot remove`,
        };
      }
      await job.remove();
      logger.info(`Job removed with Bull internal ID: ${bullJobId}`);
      return {
        success: true,
        message: `Job removed with Bull internal ID: ${bullJobId}`,
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

  async updateJob(bullJobId, updateData) {
    try {
      const job = await this.queue.getJob(bullJobId);
      if (!job) {
        logger.warn(`Job not found with Bull internal ID: ${bullJobId}, cannot update`);
        return {
          success: false,
          message: `Job not found with Bull internal ID: ${bullJobId}, cannot update`,
        };
      }
      await job.update(updateData);
      logger.info(`Job updated with Bull internal ID: ${bullJobId}`);
      return {
        success: true,
        message: `Job updated with Bull internal ID: ${bullJobId}`,
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

  async removeRepeatableJob(repeatJobKey, reminderId) {
        try {
            const jobs = await this.queue.getRepeatableJobs();
            const jobToRemove = jobs.find((job) => job.key === repeatJobKey);

            if (!jobToRemove) {
                logger.warn(`Repeatable job with key: ${repeatJobKey} not found`);
                return {
                    success: false,
                    message: `Repeatable job not found`,
                };
            }

            const pattern = `__default__:${reminderId}:::`;
             // First, remove the base repeatable job definition
            const removedBaseJob = await this.queue.removeRepeatableByKey(repeatJobKey);

             if (!removedBaseJob) {
                 logger.warn(`Repeatable job definition with key: ${repeatJobKey} not found`);
                 return {
                     success: false,
                     message: `Repeatable job definition not found`,
                 };
             }

            // Then, remove the scheduled instances.
             for (const job of jobs) {
                 if (job.key.startsWith(pattern)) {
                      await this.queue.removeRepeatableByKey(job.key);
                      logger.info(`Repeatable job with key: ${job.key} removed successfully`);
                 }
              }


            logger.info(`Repeatable job with key: ${repeatJobKey} and associated jobs removed successfully`);
            return {
                success: true,
                message: `Repeatable job with key: ${repeatJobKey} and associated jobs removed successfully`,
            };
        } catch (error) {
            logger.error(`Error removing repeatable job with key: ${repeatJobKey}`, error);
            return {
                success: false,
                message: error.message,
            };
        }
    }
}

module.exports = BullService;