const express = require('express');
const router = express.Router();
const { TaskScheduler } = require('../taskEngine/taskSchedulerEngine');
const { TaskExecutorEngine } = require('../taskEngine/taskExecutorEngine');
const NotificationModule = require('../services/notificationModule'); // Import NotificationModule
const FCMService = require('../services/fcmService');

// const taskScheduler = new TaskScheduler();
// const taskExecutorEngine = new TaskExecutorEngine();
const notificationModule = new NotificationModule();
const fcmService = new FCMService();

// Route to test scheduleTask
// router.post('/scheduleTask', async (req, res) => {
//     try {
//         const { userId, query } = req.body;
//         if (!userId || !query) {
//             return res.status(400).json({ message: 'User ID and query are required' });
//         }
//         const response = await taskScheduler.scheduleTask(userId, query);
//         res.json(response);
//     } catch (error) {
//         console.error('Error testing scheduleTask:', error);
//         res.status(500).json({ message: 'Error testing scheduleTask', error: error.message });
//     }
// });

// // Route to test executeTask
// router.post('/executeTask', async (req, res) => {
//     try {
//         const { userId, taskId, plan } = req.body;
//         if (!userId || !taskId || !plan) {
//             return res.status(400).json({ message: 'User ID, task ID, and plan are required' });
//         }
//         const response = await taskExecutorEngine.executeTask(userId, taskId, plan);
//         res.json(response);
//     } catch (error) {
//         console.error('Error testing executeTask:', error);
//         res.status(500).json({ message: 'Error testing executeTask', error: error.message });
//     }
// });

/**
 * Test endpoint for sending notifications
 * @input {
 *   body: {
 *     useruid: string,    // Required. User identifier
 *     notification: {     // Required. Notification content
 *       title: string,    // Title of the notification
 *       body: string,     // Body content
 *       [key: string]: any // Additional fields
 *     }
 *   }
 * }
 * @output {
 *   success: boolean,     // Whether operation was successful
 *   message: string,      // Description of the result
 *   bullJobId?: string,  // Job ID if successful
 *   error?: object       // Error details if failed
 * }
 */
router.post('/sendNotification', async (req, res) => {
  try {
    const { useruid, notification } = req.body;
        if (!useruid) {
            return res.status(400).json({ message: 'User ID, title, and body are required.' });
        }
        const notificationObject = await fcmService.constructNotificationObject(notification);
        const response = await notificationModule.setNotification(useruid, notificationObject);

    res.json(response);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});


module.exports = router;