// FILE: services/notificationModule.js
const Notification = require('../models/notificationModel');
const FCMService = require('./fcmService');
const { TaskQueueService } = require('./bullService');
const { ERROR_CODES } = require('../config/config-constants');
const User = require('../models/userModel');

class NotificationModule {
    constructor() {
        this.fcmService = new FCMService();
        this.bullService = new TaskQueueService(); // Using existing TaskQueueService, ensure this is what you need
        this.notificationQueue = this.bullService.queue; // Assuming your queue name is taskQueue
    }

    async setNotification(useruid, notificationObject) {
      if (!useruid) {
            console.error('User ID is required for setting notification.');
            throw { code: ERROR_CODES.INVALID_REQUEST, message: 'User ID is required for setting notification' };
        }
        if (!notificationObject) {
            console.error('Notification object is required.');
            throw { code: ERROR_CODES.INVALID_REQUEST, message: 'Notification object is required' };
        }
         try {
             const user = await User.findOne({ useruid });
             if(!user) {
                  console.error(`User not found for useruid: ${useruid}.`);
                  throw { code: ERROR_CODES.USER_NOT_FOUND, message: `User not found for useruid: ${useruid}` };
            }

             const notificationRecord = await Notification.findOne({ user: user._id });

              if(!notificationRecord) {
                    console.error(`No fcm token found for user: ${useruid}.`);
                    throw { code: ERROR_CODES.FCM_TOKEN_NOT_FOUND, message: `No fcm token found for user: ${useruid}` };
             }


              const jobData = {
                 fcmToken: notificationRecord.fcmToken,
                notification: notificationObject,
            }

          const jobResult = await this.bullService.createJob(jobData, {
               attempts: 2,
              backoff: {
                 type: 'exponential',
                 delay: 1000,
               },
             });

             if (!jobResult.success) {
                 console.error('Failed to enqueue notification to bullmq');
                   throw { code: ERROR_CODES.BULL_QUEUE_ERROR, message: 'Failed to enqueue notification to bullmq' };
             }
               console.log(`Notification enqueued successfully for user ${useruid} with jobID: ${jobResult.bullJobId}`);
                return { success: true, message: 'Notification enqueued successfully' , bullJobId: jobResult.bullJobId};
         } catch (error) {
               console.error('Error setting notification:', error);
            throw {
                 code: error.code ? error.code : ERROR_CODES.NOTIFICATION_ERROR,
                message: error.message ? error.message : 'Failed to set notification',
                 originalError: error
            }
        }
    }
}

module.exports = NotificationModule;