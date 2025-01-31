const { v4: uuidv4 } = require('uuid');

const notificationService = {
    notificationRequestMap: new Map(),
    timeout: 30000, // 30 seconds timeout, can be set in config file later

    async requestNotifications(userId, filterByApp = null, filterByContent = null, sendMessage) {
      console.log(`[DEBUG: notificationService] Requesting notifications from user device for user: ${userId}`);
        return new Promise(async (resolve, reject) => {
            const requestId = uuidv4();

            const message = {
                route: 'stMessage',
                dataType: 'Notifications',
                userId,
                requestId,
                filterByApp,
                filterByContent,
            };

          try {
              // Send message to user through websocket
              await sendMessage(userId, message);

                // Set a timeout
                const timeoutId = setTimeout(() => {
                    console.log(`[DEBUG: notificationService] Notification request timed out for request ID: ${requestId}`);
                    this.notificationRequestMap.delete(requestId);
                    resolve({ success: false, message: 'Notification request timed out.', notifications: [] });
                }, this.timeout);

                 // Store the resolve and reject functions in a map
              this.notificationRequestMap.set(requestId, {
                resolve: (data) => {
                     clearTimeout(timeoutId);
                    this.notificationRequestMap.delete(requestId);
                    console.log(`[DEBUG: notificationService] Notification request successful for request ID: ${requestId}`);
                    resolve({ success: true, message: "Notification retrieved successfully.", notifications: data });
                },
                reject: (error) => {
                    clearTimeout(timeoutId);
                    this.notificationRequestMap.delete(requestId);
                    console.error(`[DEBUG: notificationService] Notification request failed for request ID: ${requestId}`, error);
                   resolve({ success: false, message: error.message || 'Failed to get notifications.', notifications: [] });
                }
            });

          } catch (error) {
            console.error(`[DEBUG: notificationService] Error sending notification request for user: ${userId}`, error);
            reject({ success: false, message: 'Failed to send notification request.', notifications: [], error: error.message });
          }
        });
    },
    

    handleNotificationResponse(response) {
         console.log(`[DEBUG: notificationService] Handling notification response for request ID: ${response.requestId}`);

        const { requestId, notifications, error } = response;
      const storedPromise = this.notificationRequestMap.get(requestId);

      if (!storedPromise) {
          console.log(`[DEBUG: notificationService] No pending promise found for request ID: ${requestId}`);
          return;
      }
       if (error) {
         storedPromise.reject({message: error.message});
      } else if (notifications) {
          storedPromise.resolve(notifications);
      } else {
         storedPromise.reject({message: "Invalid data received from user device."})
      }
    },
};

module.exports = notificationService;