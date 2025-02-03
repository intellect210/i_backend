// const { redisClient, connectRedis } = require('./config/config-redis');
const { connectDB } = require('./config/config-db');
const { TaskExecutorEngine } = require('./taskEngine/taskExecutorEngine');
const { TaskQueueService } = require('./services/bullService');
const { ReminderQueueService } = require('./services/bullService');
const { TTL_CONFIG } = require('./config/config-constants');
const FCMService = require('./services/fcmService'); // Import FCM Service
const NotificationModule = require('./services/notificationModule');
const processRemindersEngine = require('./taskEngine/processRemindersEngine'); // Import processRemindersEngine

const taskExecutorEngine = new TaskExecutorEngine();
// Initialize FCMService and NotificationModule outside of the event handlers
const fcmService = new FCMService();
const notificationModule = new NotificationModule();

// Initialize Bull queue for task processing
const taskQueueService = new TaskQueueService();
const taskQueue = taskQueueService.queue;

// Initialize Bull queue for reminder processing
const reminderQueueService = new ReminderQueueService();
const reminderQueue = reminderQueueService.queue;


// Initialize Bull queue for notification processing
const notificationQueue = notificationModule.notificationQueue;

const redis = require('redis');

// Connect to MongoDB
(async () => {
    try {
        await connectDB();

        console.log('Connected to MongoDB');

        const redisClient = redis.createClient({
            url: process.env.REDIS_URI,
          });
          redisClient.connect();
          redisClient.on('connect', () => console.log('Redis client connected'));
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
})();

// Process jobs from taskQueue
taskQueue.process(async (job) => {
    const { userId, scheduleId, plan } = job.data;
    console.log(`[BullServer] Processing task job with ID: ${job.id} , scheduleId: ${scheduleId} for user: ${userId}`);

    try {
        if (!userId || !scheduleId || !plan) {
            console.error(`[BullServer] Job with ID ${job.id} is missing userId, scheduleId or plan data. Job data: ${JSON.stringify(job.data)}`);
            throw new Error(`Job is missing userId, scheduleId or plan data. Job data: ${JSON.stringify(job.data)}`);
        }

        // Execute the task using the task executor engine
        console.log(`[BullServer] Executing task ${scheduleId} for user ${userId}`);
        const executionResult = await taskExecutorEngine.executeTask(userId, scheduleId, plan, null, false);

        if(executionResult.success) {
            console.log(`[BullServer] Task ${scheduleId} completed successfully for user ${userId}`);
        }else{
            console.warn(`[BullServer] Task ${scheduleId} failed for user ${userId} due to ${executionResult.message}`);
        }
           
        console.log(`[BullServer] Completed processing task job with ID: ${job.id}, scheduleId: ${scheduleId} for user: ${userId} `);
        
        // Return result for complete event
        return {
          success: executionResult.success,
          message: executionResult.message,
          jobId: scheduleId // Return the scheduleId for update if needed
       };


    } catch (error) {
        console.error(`[BullServer] Error processing job with ID: ${job.id}, scheduleId: ${scheduleId} for user ${userId}:`, error);
        // Return error for failed event
        return {
            message: error.message || `Error processing job with ID: ${job.id}, scheduleId: ${scheduleId} for user ${userId}`,
            jobId: scheduleId // Return the scheduleId for update if needed
         };
    }
});


taskQueue.on('completed', async (job) => {
    try {
        console.log(`[BullServer] Job Completed callback for  job with ID: ${job.id} and scheduleId: ${job.returnvalue?.jobId}`);
         
    } catch (error) {
         console.warn(`[BullServer] Error on Job Completed callback for  job with ID: ${job.id} and scheduleId: ${job.returnvalue?.jobId}, error: ${error}`);
    }
});

taskQueue.on('failed', async (job, error) => {
    console.warn(`[BullServer] Job Failed callback for  job with ID: ${job.id} and scheduleId: ${job.failedReason?.jobId}, error: ${error}`);
});

// Process jobs from reminderQueue
reminderQueue.process(async (job) => {
    const { userId, taskDescription } = job.data;
     console.log(`[BullServer] Processing reminder job with ID: ${job.id} for user: ${userId}`);
    try {
        console.log(`[BullServer] Executing reminder: ${taskDescription} for user ${userId}`);

        const notificationResponse = await processRemindersEngine.processReminder(taskDescription, userId);
        console.log(`[BullServer] notificationResponse: ${JSON.stringify(notificationResponse)}`);
        
        const notificationObject = await fcmService.constructNotificationObject(JSON.parse(notificationResponse));
        console.log(`[BullServer] notificationObject: ${JSON.stringify(notificationObject)}`);
        
        const notificationResult = await notificationModule.setNotification(userId, notificationObject);
        console.log(`[BullServer] notificationResult: ${JSON.stringify(notificationResult)}`);
        if(notificationResult.success) {
              console.log(`[BullServer] Reminder notification sent successfully for user ${userId} with jobId: ${notificationResult.bullJobId} and message: ${notificationResult.message}`);
          } else {
                console.warn(`[BullServer] Reminder notification failed for user ${userId} with message: ${notificationResult.message}`);
          }


        console.log(`[BullServer] Completed processing reminder job with ID: ${job.id} for user ${userId} `);
          return {
              success: true,
              message: `reminder: ${taskDescription} for user ${userId} and notification sent with message: ${notificationResult.message}`,
          };
    } catch (error) {
         console.error(`[BullServer] Error processing job with ID: ${job.id} for user ${userId}:`, error);
        // Return error for failed event
        return {
            message: error.message || `Error processing job with ID: ${job.id} for user ${userId}`,
        };
    }
});

reminderQueue.on('completed', async (job) => {
    try {
        console.log(`[BullServer] Job Completed callback for reminder job with ID: ${job.id}`);
    } catch (error) {
         console.warn(`[BullServer] Error on Job Completed callback for reminder job with ID: ${job.id}, error: ${error}`);
    }
});

reminderQueue.on('failed', async (job, error) => {
   console.warn(`[BullServer] Job Failed callback for reminder job with ID: ${job.id}, error: ${error}`);
});

// Process jobs from notificationQueue
notificationQueue.process(async (job) => {
    const { fcmToken, notification } = job.data; // Destructure from job.data
    console.log(`[BullServer] notification ${notification}`);
     console.log(`[BullServer] Processing notification job with ID: ${job.id}`);
      try {
          if (!fcmToken || !notification) {
            console.error(`[BullServer] Job with ID ${job.id} is missing fcmToken or notification data. Job data: ${JSON.stringify(job.data)}`);
            throw new Error(`Job is missing fcmToken or notification data. Job data: ${JSON.stringify(job.data)}`);
        }

       const notificationResult = await fcmService.sendFcmNotification(fcmToken, notification);
       if(notificationResult.success) {
            console.log(`[BullServer] Notification sent successfully with ID: ${job.id}`);
          } else {
               console.warn(`[BullServer] Notification failed for  job with ID: ${job.id} due to ${notificationResult.message}`);
          }
             // Return result for complete event
            return {
              success: notificationResult.success,
             message: notificationResult.message,
           };
    } catch (error) {
          console.error(`[BullServer] Error processing notification job with ID: ${job.id}:`, error);
           return {
            message: error.message || `Error processing notification job with ID: ${job.id}`,
         };
     }
});

notificationQueue.on('completed', async (job) => {
    try {
        console.log(`[BullServer] Job Completed callback for notification job with ID: ${job.id}`);
    } catch (error) {
         console.warn(`[BullServer] Error on Job Completed callback for notification job with ID: ${job.id}, error: ${error}`);
    }
});

notificationQueue.on('failed', async (job, error) => {
   console.warn(`[BullServer] Job Failed callback for notification job with ID: ${job.id}, error: ${error}`);
});

console.log('Bull worker server started.');