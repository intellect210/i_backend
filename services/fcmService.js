// FILE: services/fcmService.js
const admin = require('firebase-admin');
const { ERROR_CODES } = require('../config/config-constants');

class FCMService {
    static firebaseApp = null;

  constructor() {
    try {
        if (!FCMService.firebaseApp) {
            // Firebase Admin SDK credentials (INSECURE - DO NOT USE IN PRODUCTION)
            const serviceAccount = {
              "type": "service_account",
              "project_id": "project24-f0148",
              "private_key_id": "c6f946b8a8a6dd278395f6b45e6f80f5120b8cdd",
              "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1/ZJMZ7TSQQVl\nB4ueUn7A0tvu/CIL2zZFj3vLZNTgY7aexc8aFEoRvkHSDi0nrYkPG4x4cj0gp/OY\np2wS583mHs6VoVHYca/vKDshS6Lb2npyJFlSetXLRAMGvqRlIN0KW+gGe/UpUFzr\nfl6AhZ7RhjEnBgKGpL/NMx0juA300skUo6cs6TBspP5E6WyZhC7dW69W4l9oIsz7\n3aTwgnaltDMkwE+WG6ObSddrMj2qHXA97FWPT6R1etW4j2sghYplz5KKYsY+k6+9\nUGFY7gJzSQiozoZDXAIfPU47V9CfdQZKIPIBE64aNnpk+3WKKNOG4Y1iOS0ImVla\nEprve7+ZAgMBAAECggEABWYWfcttIE2gfizuoI2RnWEZTX96TRVoM0ER6uiSA27B\n1KJJRgdIY+Vb04JAfFcCuV7Xrce0djBf+BfYthOIAVB0UBkJ3LIRW4wQe6jgQHBn\nRdU74cgAvqJvtTauRCJo8ZfktrMyWdLnUW8dbjzzMgOul+9ENOqp6/RHuYRfbvNN\nnsU2b6j2VTnmfzh+4F/v79wx/7Ua6UIr4eMzrYnPGjJvj5fLl9VsIUZqNKTlwJeA\nNf8tR44qQdXBKYbEZHRsvR61O6Avdqp3GYZVIMawAd8Epq3vgK+OsVLfNFudLt2Q\nYV5yDp16A+AUFraUs15qyNeeatUB57Q7EXGIy3iMxwKBgQDBKOmzN5e4+DxEJPGV\nLM2qmNXw+G7M7WXScCl8Wqrh1BGTeWhzflRXqme4SA/XiyYHHUxbw6hS0yfJuyqb\nISbLMkygx/XJ292bOel1oztaKyH0HQwn6eHHBVqEyMtgZSTqzLxqNocpXvYxuuse\nkPs4RyxpvZLMdYkJiJMSn9UREwKBgQDxMm+58yixIDzIox5MzxPVePpW3M2DYGoB\nGY0yH0UHh6DbI6BNCCxAxDIB8PllPpnnHqSBD954zsN0XzHG3FivrfSIxRHrkpW3\n/YS5qJk04dCtC2hdsnXmzN5wGNXXo9cyTO/adCo/xlJOZc+4WrZrZPZwMn8sI7xa\nvxgMNLMuIwKBgEN59VnD+96D6RmtBi+kfRwxU9tgDeTMsZs3z2Y/jh5hpNotuU1P\nPkt5nc4EbnRPibNGitwrl2uHlAimt5WFmTW2loo8ECK6CcomCuYrZZp0IuJSG2L+\nEv8hYaOtOU6tRp43c0JvVfwfzkVFFMmSwA/C3UL7FIMUNBD+gtIov5e9AoGBAK0g\nN8PwPngNHLQjKX+Wb7UdtgsdSEKRtOT/MzMT8Nd7ycEh7FD+mc0PRpnQHyNF8PBN\nNWUSP+zU9MSWA8Oqq9nF8i0tzzQZLnA3f8pHs1ia8c8TziDbFPfKe6tYmD3Fc5S+\nVremBCFst+1f9N5t9lxVxvI3vMKxD+TPH3K7bRWjAoGANEgjwA1YWzK/hMq8k066\nJ1fBNfpGR9/Bdy22V2o5UuiSi8uF/f1I7bD1yjwkm0Z1WgS855ybnk0MSeOvEYwy\nZ1BiiBmrv74rys9ji0B2uFdUZf8Q8Bw5xkeTwxrAC03QizZiSOVU6ey2xzNGajzu\n/WuR7tGXHlDjhrAN87gYi9I=\n-----END PRIVATE KEY-----\n",
              "client_email": "firebase-adminsdk-4grlb@project24-f0148.iam.gserviceaccount.com",
              "client_id": "116406425380364636968",
              "auth_uri": "https://accounts.google.com/o/oauth2/auth",
              "token_uri": "https://oauth2.googleapis.com/token",
              "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
              "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-4grlb%40project24-f0148.iam.gserviceaccount.com",
              "universe_domain": "googleapis.com"
            }
            
             if (!serviceAccount || typeof serviceAccount !== 'object') {
                  throw new Error('Invalid Firebase Admin Credentials provided.');
            }

            FCMService.firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
              });

             console.log('Firebase Admin SDK initialized successfully.');
            }
      this.messaging = admin.messaging(); // Removed FCMService.firebaseApp argument here
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
       throw { code: ERROR_CODES.FCM_INITIALIZATION_ERROR, message: 'Firebase Admin SDK initialization failed', originalError: error };
     }
   }

   /**
    * Constructs a notification object for FCM
    * @input {
    *   data: {            // Required. Notification data
    *     title: string,   // Title of the notification
    *     body: string,    // Body of the notification
    *     [key: string]: any // Additional custom fields
    *   }
    * }
    * @output {
    *   notification: {    // Formatted FCM notification object
    *     [key: string]: any // All notification data fields
    *   }
    * }
    */
   async constructNotificationObject(data = {}) {
    // if (!title || !body) {
    //     console.error('Title and body are required for FCM notification.');
    //     throw { code: ERROR_CODES.INVALID_REQUEST, message: 'Title and body are required for FCM notification' };
    // }

    try {
        return {
            notification: {
               ...data
           },
        };
     } catch (error) {
        console.error('Error constructing FCM notification object:', error);
         throw { code: ERROR_CODES.FCM_NOTIFICATION_CONSTRUCTION_ERROR, message: 'Failed to construct FCM notification object', originalError: error};
    }
  }

  /**
   * Sends notification through Firebase Cloud Messaging
   * @input {
   *   fcmToken: string,  // Required. Target device FCM token
   *   notification: {    // Required. Notification content
   *     title: string,   // Title of the notification
   *     body: string,    // Body of the notification
   *     [key: string]: any // Additional fields
   *   }
   * }
   * @output {
   *   success: boolean,  // Whether sending was successful
   *   message: string,   // Description of the result
   *   response?: object, // FCM response if successful
   *   error?: object    // Error details if failed
   * }
   */
  async sendFcmNotification(fcmToken, notification) {
    if (!fcmToken) {
        console.error('FCM token is required for sending notification.');
         return { success: false, message: 'FCM token is required' };
     }
     if (!notification) {
         console.error('Notification payload is required.');
         return { success: false, message: 'Notification payload is required' };
     }

     const message = {
        token: fcmToken,
        data: {
            notification: JSON.stringify(notification),
        }
     }
    try {
      const response = await this.messaging.send(message);
      console.log('Successfully sent message:', response);
      if(response.failureCount > 0) {
          const errorDetails = response.responses.filter(res => res.error).map(res => res.error);
           return {
              success: false,
              message: `Failed to send FCM message to ${fcmToken}`,
              error: errorDetails,
          }
      }
      return { success: true, message: `Successfully sent message to ${fcmToken}`, response };
    } catch (error) {
      console.error('Error sending message to FCM:', error);
        return {
           success: false,
           message: `Failed to send FCM message to ${fcmToken}`,
           error: error
        };
    }
  }
}

module.exports = FCMService;