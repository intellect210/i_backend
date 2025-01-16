const Queue = require('bull');
const { redisClient } = require('../config/redisConfig');
const { handleRedisError } = require('../utils/errorHandlers');
const { ERROR_CODES } = require('../config/constants');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BullService {
  constructor() {
    this.queue = new Queue('reminderQueue', {
      redis: {
        client: redisClient,
      },
        defaultJobOptions: {
            removeOnComplete: true, // Remove jobs on completion
            attempts: 3,            // Max number of attempts
            backoff: {
                type: 'exponential',
                delay: 1000, // Initial delay of 1 second (can increase with 'exponential' type)
            },
        }
    });

      this.queue.on('error', (error) => {
          logger.error(`Bull queue error:`, error);
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
          message: `Job created with ID: ${job.id}`
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
              message: `Job not found with ID: ${jobId}`
        }
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

     onCompleted(callback) {
        this.queue.on('completed', async (job) => {
            try {
                await callback(job);
                 logger.info(`Job completed with ID: ${job.id} removed from queue`);
               
            } catch (error) {
                logger.error(`Error in onCompleted callback for job ID ${job.id}:`, error);
            }
        });
    }


  onFailed(callback) {
    this.queue.on('failed', async (job, error) => {
      try {
        await callback(job, error);
        logger.warn(`Job failed with ID: ${job.id}, error: ${error}. Retries exhausted, marking as failed.`);
      } catch (callbackError) {
        logger.error(`Error in onFailed callback for job ID ${job.id}:`, callbackError);
      }
    });
  }
}

module.exports = BullService;