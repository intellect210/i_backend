const Queue = require('bull');
const { redisClient } = require('../../config/redisConfig');
const { connectDB } = require('../../config/dbConfig');
const Reminder = require('../../models/reminderModel');
const logger = require('../../utils/logger');
const SchedulerService = require('../../services/schedulerService');
const schedulerService = new SchedulerService();


// Initialize Bull queue
const reminderQueue = new Queue('reminderQueue', {
    redis: {
        client: redisClient,
    },
});

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
})();

// Demo function simulating a 15-second task
const simulateLongTask = async () => {
    logger.info('Simulating a long task that will take 15 seconds');
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            logger.info('Long Task Simulation Completed');
        }, 15000); // 15 seconds
    });
};

// Process jobs
reminderQueue.process(async (job) => {
    const { userId, taskDescription, time, recurrence } = job.data;
    // logger.info(`[${new Date().toISOString()}] Processing job with ID: ${job.id} for user ${userId} with task: ${taskDescription} at time: ${time}`);

    try {
        // Simulate some work
       await simulateLongTask();


        // Example condition for a job failure
        if (Math.random() < 0.2) {
           logger.warn(`Simulating Job Fail for id ${job.id}`)
           throw new Error('Simulated job failure.');
        }


        logger.info(`[${new Date().toISOString()}] Successfully processed job with ID: ${job.id}`);

    } catch (error) {
        logger.error(`[${new Date().toISOString()}] Job with ID: ${job.id} failed`, error);
        throw error; // This re-throws the error, causing Bull to mark the job as failed
    }
});

schedulerService.onReminderCompleted(async (job) => {
    logger.info(`[${new Date().toISOString()}] Job Completed callback for  job with ID: ${job.id}`);
});

schedulerService.onReminderFailed(async (job, error) => {
    logger.warn(`[${new Date().toISOString()}] Job Failed callback for  job with ID: ${job.id}, error: ${error}`);
});

logger.info('Bull worker server started.');