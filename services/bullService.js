const Queue = require('bull');
const { redisClient } = require('../config/config-redis');
const { handleRedisError } = require('../utils/helpers/error-handlers');
const { ERROR_CODES } = require('../config/config-constants');
const { v4: uuidv4 } = require('uuid');
const Reminder = require('../models/reminderModel');
const logger = require('../utils/helpers/logger');
const config = require('../config/config-main');

class BaseQueueService {
    constructor(queueName, defaultJobOptions) {
        this.queueName = queueName;
        this.defaultJobOptions = defaultJobOptions || {
            removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        };

        this.queue = new Queue(this.queueName, {
            redis: config.redisUri,
            defaultJobOptions: this.defaultJobOptions,
        });

        this.queue.on('error', (error) => this.handleError(error));
    }

    handleError(error) {
        logger.error(`Bull queue "${this.queueName}" error:`, error);
    }

    /**
     * Creates a new job in the queue
     * @input {
     *   jobData: object,   // Required. Data for the job
     *   options: {         // Optional. Job configuration
     *     attempts?: number,
     *     backoff?: object,
     *     priority?: number,
     *     delay?: number
     *   }
     * }
     * @output {
     *   success: boolean,  // Whether job was created
     *   bullJobId?: string,    // Unique job identifier
     *   bullInternalJobId?: string, // Internal Bull job ID
     *   repeatJobKey?: string, // Key for repeatable jobs
     *   message?: string   // Error message if failed
     * }
     */
    async createJob(jobData, options) {
        let job;
        try {
            const bullJobId = uuidv4();
            job = await this.queue.add(jobData, { ...options, jobId: bullJobId, timeout: 900000 });
             logger.info(`Job created in queue "${this.queueName}" with Bull internal ID: ${job.id}, our Bull Job ID: ${bullJobId}`);
            logger.debug(`[DEBUG: BullService] Job object: ${JSON.stringify(job)}`);
            logger.debug(`[DEBUG: BullService] repeatJobKey: ${job.repeatJobKey}`);
            console.log(`[DEBUG: BullService] repeatJobKey: ${job.repeatJobKey}`);
            return { success: true, bullJobId, bullInternalJobId: job.id, repeatJobKey: job.repeatJobKey };
        } catch (error) {
             logger.error(`Error creating job in queue "${this.queueName}":`, error);
            handleRedisError(error, ERROR_CODES.REDIS_ERROR);
            return { success: false, message: error.message || `Error creating job in queue "${this.queueName}"` };
        }
    }

     async getJob(bullJobId) {
        try {
            const job = await this.queue.getJob(bullJobId);
            if (!job) {
                logger.warn(`Job not found in queue "${this.queueName}" with Bull internal ID: ${bullJobId}`);
                return {
                    success: false,
                    message: `Job not found in queue "${this.queueName}" with Bull internal ID: ${bullJobId}`,
                };
            }
            logger.info(`Job retrieved from queue "${this.queueName}" with Bull internal ID: ${bullJobId}`);
            return {
                success: true,
                job,
            };
        } catch (error) {
            logger.error(`Error getting job from queue "${this.queueName}":`, error);
            handleRedisError(error, ERROR_CODES.REDIS_ERROR);
            return {
                success: false,
                message: error.message || `Error getting job from queue "${this.queueName}"`,
            };
        }
    }

    async removeJob(bullJobId) {
        try {
            const job = await this.queue.getJob(bullJobId);
            if (!job) {
                logger.warn(`Job not found in queue "${this.queueName}" with Bull internal ID: ${bullJobId}, cannot remove`);
                return {
                    success: false,
                    message: `Job not found in queue "${this.queueName}" with Bull internal ID: ${bullJobId}, cannot remove`,
                };
            }
            await job.remove();
            logger.info(`Job removed from queue "${this.queueName}" with Bull internal ID: ${bullJobId}`);
            return {
                success: true,
                message: `Job removed from queue "${this.queueName}" with Bull internal ID: ${bullJobId}`,
            };
        } catch (error) {
            logger.error(`Error removing job from queue "${this.queueName}":`, error);
            handleRedisError(error, ERROR_CODES.REDIS_ERROR);
            return {
                success: false,
                message: error.message || `Error removing job from queue "${this.queueName}"`,
            };
        }
    }

    async updateJob(bullJobId, updateData) {
        try {
            const job = await this.queue.getJob(bullJobId);
            if (!job) {
                logger.warn(`Job not found in queue "${this.queueName}" with Bull internal ID: ${bullJobId}, cannot update`);
                return {
                    success: false,
                    message: `Job not found in queue "${this.queueName}" with Bull internal ID: ${bullJobId}, cannot update`,
                };
            }
            await job.update(updateData);
            logger.info(`Job updated in queue "${this.queueName}" with Bull internal ID: ${bullJobId}`);
            return {
                success: true,
                message: `Job updated in queue "${this.queueName}" with Bull internal ID: ${bullJobId}`,
            };
        } catch (error) {
            logger.error(`Error updating job in queue "${this.queueName}":`, error);
            handleRedisError(error, ERROR_CODES.REDIS_ERROR);
            return {
                success: false,
                message: error.message || `Error updating job in queue "${this.queueName}"`,
            };
        }
    }

    async getQueueState() {
        try {
            const counts = await this.queue.getJobCounts();
            logger.info(`Queue "${this.queueName}" state retrieved.`);
            return {
                success: true,
                counts,
            };
        } catch (error) {
            logger.error(`Error getting queue "${this.queueName}" state:`, error);
            handleRedisError(error, ERROR_CODES.REDIS_ERROR);
            return {
                success: false,
                message: error.message || `Error getting queue "${this.queueName}" state`,
            };
        }
    }

    /**
     * Removes a repeatable job from the queue
     * @input {
     *   repeatJobKey: string,  // Required. Key of repeatable job
     *   reminderId: string     // Required. ID of the reminder
     * }
     * @output {
     *   success: boolean,      // Whether removal was successful
     *   message: string        // Description of the result
     * }
     */
    async removeRepeatableJob(repeatJobKey, reminderId) {
        try {
            const jobs = await this.queue.getRepeatableJobs();
            const jobToRemove = jobs.find((job) => job.key === repeatJobKey);

            if (!jobToRemove) {
                logger.warn(`Repeatable job with key: ${repeatJobKey} not found in queue "${this.queueName}"`);
                return {
                    success: false,
                    message: `Repeatable job not found in queue "${this.queueName}"`,
                };
            }

            const pattern = `__default__:${reminderId}:::`;
            // First, remove the base repeatable job definition
            const removedBaseJob = await this.queue.removeRepeatableByKey(repeatJobKey);

            if (!removedBaseJob) {
                logger.warn(`Repeatable job definition with key: ${repeatJobKey} not found in queue "${this.queueName}"`);
                return {
                    success: false,
                    message: `Repeatable job definition not found in queue "${this.queueName}"`,
                };
            }

            // Then, remove the scheduled instances.
            for (const job of jobs) {
                if (job.key.startsWith(pattern)) {
                    await this.queue.removeRepeatableByKey(job.key);
                    logger.info(`Repeatable job with key: ${job.key} removed successfully from queue "${this.queueName}"`);
                }
            }

            logger.info(`Repeatable job with key: ${repeatJobKey} and associated jobs removed successfully from queue "${this.queueName}"`);
            return {
                success: true,
                message: `Repeatable job with key: ${repeatJobKey} and associated jobs removed successfully from queue "${this.queueName}"`,
            };
        } catch (error) {
            logger.error(`Error removing repeatable job with key: ${repeatJobKey} from queue "${this.queueName}"`, error);
            return {
                success: false,
                message: error.message,
            };
        }
    }
}

class ReminderQueueService extends BaseQueueService {
    constructor() {
        super('reminderQueue', {
             removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        this.setupListeners();
    }

    setupListeners() {
         this.queue.on('completed', async (job) => this.handleJobCompleted(job));
         this.queue.on('failed', async (job, error) => this.handleJobFailed(job, error));
    }

     async handleJobCompleted(job) {
        try {
            await this.updateReminderJobId(job.id, job.returnvalue?.jobId);
            logger.info(`Job completed with ID: ${job.id} removed from queue "${this.queueName}". New job ID: ${job.returnvalue?.jobId}`);
        } catch (error) {
            logger.error(`Error updating job ID for completed job ${job.id} in queue "${this.queueName}":`, error);
        }
    }

    async handleJobFailed(job, error) {
        try {
            if (job.attemptsMade >= job.opts.attempts) {
                 await this.updateReminderJobId(job.id, job.failedReason?.jobId);
                logger.warn(`Job failed with ID: ${job.id} in queue "${this.queueName}", error: ${error}. Retries exhausted, marking as failed. New job ID: ${job.failedReason?.jobId}`);
            }
        } catch (callbackError) {
            logger.error(`Error updating job ID for failed job ${job.id} in queue "${this.queueName}":`, callbackError);
        }
    }

    async updateReminderJobId(oldJobId, newJobId) {
        if (newJobId && oldJobId !== newJobId) {
            const reminder = await Reminder.findOne({ reminderId: oldJobId });
            if (reminder) {
                reminder.reminderId = newJobId;
                await reminder.save();
                logger.info(`Updated reminder in MongoDB. Old job ID: ${oldJobId}, New job ID: ${newJobId}`);
            }
        }
    }
}

class TaskQueueService extends BaseQueueService {
    constructor() {
        super('taskQueue',{
             removeOnComplete: true,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        this.setupListeners();
    }

   setupListeners() {
        this.queue.on('completed', (job) => this.handleJobCompleted(job));
        this.queue.on('failed', (job, error) => this.handleJobFailed(job, error));
    }

    async handleJobCompleted(job) {
        logger.info(`Job completed with ID: ${job.id} removed from queue "${this.queueName}".`);
    }

   async handleJobFailed(job, error) {
         logger.warn(`Job failed with ID: ${job.id} in queue "${this.queueName}", error: ${error}. Retries exhausted, marking as failed.`);
    }

    // You can define more specific methods for taskQueue
}

class NotificationQueueService extends BaseQueueService {
    constructor() {
        super('notificationQueue', {
             removeOnComplete: true,
             attempts: 2,
            backoff: {
                 type: 'exponential',
                 delay: 1000,
              },
         });
       this.setupListeners();
    }

   setupListeners() {
         this.queue.on('completed', (job) => this.handleJobCompleted(job));
         this.queue.on('failed', (job, error) => this.handleJobFailed(job, error));
    }

     async handleJobCompleted(job) {
           logger.info(`Job completed with ID: ${job.id} removed from queue "${this.queueName}".`);
      }

     async handleJobFailed(job, error) {
          logger.warn(`Job failed with ID: ${job.id} in queue "${this.queueName}", error: ${error}. Retries exhausted, marking as failed.`);
     }

   // You can define more specific methods for notificationQueue
}


module.exports = {
    ReminderQueueService,
     TaskQueueService,
     NotificationQueueService,
};