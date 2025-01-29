const { redisClient, connectRedis } = require('../../config/config-redis');
const { connectDB } = require('../../config/config-db');
const logger = require('../../utils/helpers/logger');
const { TaskExecutorEngine } = require('../../taskEngine/taskExecutorEngine');
const { TaskQueueService } = require('../../services/bullService');
const { TTL_CONFIG } = require('../../config/config-constants');

const taskExecutorEngine = new TaskExecutorEngine();

// Initialize Bull queue for task processing
const taskQueueService = new TaskQueueService();
const taskQueue = taskQueueService.queue;

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
        await connectRedis();
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
})();

// Process jobs from taskQueue
taskQueue.process(async (job) => {
    const { userId, scheduleId, plan } = job.data;
    logger.info(`[BullServer] Processing task job with ID: ${job.id} , scheduleId: ${scheduleId} for user: ${userId}`);

    try {
        if (!userId || !scheduleId || !plan) {
            logger.error(`[BullServer] Job with ID ${job.id} is missing userId, scheduleId or plan data. Job data: ${JSON.stringify(job.data)}`);
            throw new Error(`Job is missing userId, scheduleId or plan data. Job data: ${JSON.stringify(job.data)}`);
        }

        // Execute the task using the task executor engine
        logger.info(`[BullServer] Executing task ${scheduleId} for user ${userId}`);
        const executionResult = await taskExecutorEngine.executeTask(userId, scheduleId, plan);

        if(executionResult.success) {
            logger.info(`[BullServer] Task ${scheduleId} completed successfully for user ${userId}`);
        }else{
            logger.warn(`[BullServer] Task ${scheduleId} failed for user ${userId} due to ${executionResult.message}`);
        }
           
        logger.info(`[BullServer] Completed processing task job with ID: ${job.id}, scheduleId: ${scheduleId} for user: ${userId} `);
        
        // Return result for complete event
        return {
          success: executionResult.success,
          message: executionResult.message,
          jobId: scheduleId // Return the scheduleId for update if needed
       };


    } catch (error) {
        logger.error(`[BullServer] Error processing job with ID: ${job.id}, scheduleId: ${scheduleId} for user ${userId}:`, error);
        // Return error for failed event
        return {
            message: error.message || `Error processing job with ID: ${job.id}, scheduleId: ${scheduleId} for user ${userId}`,
            jobId: scheduleId // Return the scheduleId for update if needed
         };
    }
});


taskQueue.on('completed', async (job) => {
    try {
        logger.info(`[BullServer] Job Completed callback for  job with ID: ${job.id} and scheduleId: ${job.returnvalue?.jobId}`);
         
    } catch (error) {
         logger.warn(`[BullServer] Error on Job Completed callback for  job with ID: ${job.id} and scheduleId: ${job.returnvalue?.jobId}, error: ${error}`);
    }
});

taskQueue.on('failed', async (job, error) => {
    logger.warn(`[BullServer] Job Failed callback for  job with ID: ${job.id} and scheduleId: ${job.failedReason?.jobId}, error: ${error}`);
});

logger.info('Bull task worker server started.');