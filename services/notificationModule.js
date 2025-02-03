// FILE: services/notificationModule.js
const Notification = require('../models/notificationModel');
const FCMService = require('./fcmService');
const { NotificationQueueService } = require('./bullService'); // Import the new service
const { ERROR_CODES } = require('../config/config-constants');
const User = require('../models/userModel');
const logger = require('../utils/helpers/logger');

class NotificationModule {
    constructor() {
        this.fcmService = new FCMService();
         this.bullService = new NotificationQueueService(); // Using new NotificationQueueService
        this.notificationQueue = this.bullService.queue; // Using this queue now
    }

    /**
     * Sets up and enqueues a notification for a user
     * @input {
     *   useruid: string,    // Required. Unique identifier for the user
     *   notificationObject: {  // Required. Notification details
     *     title: string,    // Title of the notification
     *     body: string,     // Body content of the notification
     *   }
     * }
     * @output {
     *   success: boolean,   // Whether operation was successful
     *   message: string,    // Description of the result
     *   bullJobId?: string  // ID of the created job if successful
     *   error?: object      // Error details if failed
     * }
     */
    async setNotification(useruid, notificationObject) {
      if (!useruid) {
           logger.error('User ID is required for setting notification.');
           throw { code: ERROR_CODES.INVALID_REQUEST, message: 'User ID is required for setting notification' };
       }
      if (!notificationObject) {
            logger.error('Notification object is required.');
           throw { code: ERROR_CODES.INVALID_REQUEST, message: 'Notification object is required' };
        }
         try {
             const user = await User.findOne({ useruid });
             if(!user) {
                   logger.error(`User not found for useruid: ${useruid}.`);
                   throw { code: ERROR_CODES.USER_NOT_FOUND, message: `User not found for useruid: ${useruid}` };
             }

             const notificationRecord = await Notification.findOne({ user: user._id });

              if(!notificationRecord) {
                    logger.error(`No fcm token found for user: ${useruid}.`);
                    throw { code: ERROR_CODES.FCM_TOKEN_NOT_FOUND, message: `No fcm token found for user: ${useruid}` };
             }


              const jobData = {
                fcmToken: notificationRecord.fcmToken,
                ...notificationObject
            }

          const jobResult = await this.bullService.createJob(jobData, {
               attempts: 2,
              backoff: {
                 type: 'exponential',
                 delay: 1000,
               },
             });

             if (!jobResult.success) {
                logger.error('Failed to enqueue notification to bullmq');
                   throw { code: ERROR_CODES.BULL_QUEUE_ERROR, message: 'Failed to enqueue notification to bullmq' };
            }
               logger.info(`Notification enqueued successfully for user ${useruid} with jobID: ${jobResult.bullJobId}`);
                return { success: true, message: 'Notification enqueued successfully' , bullJobId: jobResult.bullJobId};
         } catch (error) {
              logger.error('Error setting notification:', error);
            throw {
                 code: error.code ? error.code : ERROR_CODES.NOTIFICATION_ERROR,
                message: error.message ? error.message : 'Failed to set notification',
                 originalError: error
            }
        }
    }
}

module.exports = NotificationModule;