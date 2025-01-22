```markdown
# API Route Documentation

This document provides a detailed overview of all API routes available in the `i_backend` project. Each route is described with its method, endpoint, purpose, request body (if any), and a sample response.

## Table of Contents

- [Agent Routes](#agent-routes)
- [Chat Routes](#chat-routes)
- [Message Routes](#message-routes)
- [Personalization Routes](#personalization-routes)
- [Preference Routes](#preference-routes)
- [Reminder Routes](#reminder-routes)
- [Session Routes](#session-routes)
- [User Routes](#user-routes)
- [Waitlist Routes](#waitlist-routes)
- [Extra Routes](#extra-routes)
- [Test Routes](#test-routes)
- [Vector Routes](#vector-routes)


---

## Agent Routes

### 1. Set Gmail Tokens
- **Method**: `POST`
- **Endpoint**: `/api/agents/gs/gmail/settokens/:useruid`
- **Description**: Sets Gmail tokens (authCode, refreshToken, accessToken) for a specified user.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**:
```json
{
  "authCode": "your_auth_code",
  "refreshToken": "your_refresh_token",
  "accessToken": "your_access_token"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "Tokens set successfully"
}
```
- **Sample Response (User not found)**:
```json
{
    "code": "USER_NOT_FOUND",
    "message": "User not found"
}
```
---
## Chat Routes

### 1. Get All Chats
- **Method**: `GET`
- **Endpoint**: `/api/chats`
- **Description**: Retrieves all chats associated with the authenticated user.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
[
    {
        "_id": "6651e1a90c0a92220d71c58e",
        "userId": "testuser123",
        "chatname": "",
        "status": "active",
        "createdAt": "2024-05-25T13:20:41.537Z",
        "updatedAt": "2024-05-25T13:20:41.537Z"
    },
    {
        "_id": "6651e1b90c0a92220d71c58f",
        "userId": "testuser123",
        "chatname": "",
        "status": "active",
        "createdAt": "2024-05-25T13:20:57.293Z",
        "updatedAt": "2024-05-25T13:20:57.293Z"
    }
]
```

### 2. Delete Chat
- **Method**: `DELETE`
- **Endpoint**: `/api/chats/deletechat/:chatId`
- **Description**: Deletes a specific chat by its ID.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response (Success)**:
```json
{
    "message": "Chat deleted"
}
```
- **Sample Response (Not Found)**:
```json
{
    "message": "Chat not found"
}
```

---
## Message Routes

### 1. Get All Messages
- **Method**: `GET`
- **Endpoint**: `/api/messages/:useruid/getallmessages/:chatId`
- **Description**: Retrieves all messages for a specific chat and user.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
[
    {
        "messageId": "6651e1a90c0a92220d71c590",
        "message": "hi",
        "messageType": "text",
        "role": "user",
        "timestamp": "2024-05-25T13:20:41.539Z",
        "tempId": null,
        "isPending": false
    },
    {
        "messageId": "6651e1a90c0a92220d71c591",
        "message": "Hello, I'm intellect",
        "messageType": "text",
        "role": "bot",
        "timestamp": "2024-05-25T13:20:41.539Z",
         "tempId": null,
        "isPending": false
    }
]
```

---
## Personalization Routes

### 1. Update Personalization Information
- **Method**: `POST`
- **Endpoint**: `/api/personalization/integration/info`
- **Description**: Updates personalization information for the authenticated user.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**:
```json
{
  "personalised_name": "NewPersonalizedName",
  "model_behaviour": "NewModelBehavior",
  "personal_info": "NewPersonalInfo"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "Personalization information updated"
}
```

### 2. Get Personalization Information
- **Method**: `GET`
- **Endpoint**: `/api/personalization/integration/info`
- **Description**: Retrieves personalization information for the authenticated user.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
{
  "personalisedName": "intellect",
  "modelBehaviour": "",
  "personalInfo": ""
}
```

---
## Preference Routes

### 1. Get User Preference
- **Method**: `GET`
- **Endpoint**: `/api/preferences/:preferenceKey`
- **Description**: Retrieves a specific user preference by key.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
{
  "NOTIFICATION_PERMISSION": true
}
```
### 2. Set User Preference
- **Method**: `POST`
- **Endpoint**: `/api/preferences`
- **Description**: Sets a user preference value.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**:
```json
{
  "preferenceKey": "NOTIFICATION_PERMISSION",
  "value": true
}
```
- **Sample Response**:
```json
{
  "message": "Preference set successfully"
}
```
### 3. Get All User Preferences
- **Method**: `GET`
- **Endpoint**: `/api/preferences`
- **Description**: Gets all user preferences.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
{
  "NOTIFICATION_PERMISSION": false,
  "DARK_MODE": false,
  "GMAIL_PERMISSION": false
}
```

---
## Reminder Routes

### 1. Get All Schedules
- **Method**: `GET`
- **Endpoint**: `/api/reminders`
- **Description**: Retrieves all reminders scheduled for the authenticated user.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
[
    {
        "_id": "6651e413c8f0f6061596710e",
        "userId": "testuser123",
        "reminderId": "234a34a-2334-234324-432423",
        "bullInternalJobId": "234a34a-2334-234324-432423",
        "taskDescription": "test task",
        "time": "12:00",
        "recurrence": {
            "type": "once",
            "one_time_date": "2024-05-25"
        },
        "status": "scheduled",
        "createdAt": "2024-05-25T13:30:11.198Z",
        "updatedAt": "2024-05-25T13:30:11.198Z",
        "bullRepeatOptions": {
            "delay": 1612520
        }
    }
]
```

### 2. Delete Schedule
- **Method**: `DELETE`
- **Endpoint**: `/api/reminders/:_id`
- **Description**: Deletes a reminder schedule using its unique ID.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response (Success)**:
```json
{
    "status": "success",
    "message": "Reminder deleted successfully."
}
```
- **Sample Response (Reminder not found)**:
```json
{
    "status": "error",
    "message": "Reminder not found."
}
```

---
## Session Routes

### 1. JWT Creation (Login)
- **Method**: `POST`
- **Endpoint**: `/api/sessions/jwtcreation`
- **Description**: Creates or updates a user session and generates a JWT.
- **Authentication**: None
- **Request Body**:
```json
{
    "useruid": "testuser123",
    "deviceInfo": "someDeviceInfo"
}
```
- **Sample Response (Success)**:
```json
{
  "message": "Session created",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VydWlkIjoidGVzdHVzZXIxMjMiLCJpYXQiOjE3MTY2MzM3NzEsImV4cCI6MTc0NzU5Mzc3MX0.m1R5s9yL1X5vP5t_n2Jq0b9m_8g_y4P0_7_y6_1_o7s"
}
```

### 2. Logout
- **Method**: `POST`
- **Endpoint**: `/api/sessions/logout`
- **Description**: Invalidates the user session using a valid token.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response (Success)**:
```json
{
    "message": "Logged out successfully"
}
```
- **Sample Response (Session not found)**:
```json
{
    "message": "Session not found, already logged out"
}
```
### 3. Activate Session
- **Method**: `POST`
- **Endpoint**: `/api/sessions/activate`
- **Description**: Activate a user session by useruid.
- **Authentication**: None
- **Request Body**:
```json
{
   "useruid": "testuser123"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "Session activated"
}
```
- **Sample Response (Session not found)**:
```json
{
    "message": "Session not found"
}
```
### 4. Deactivate Session
- **Method**: `POST`
- **Endpoint**: `/api/sessions/deactivate`
- **Description**: Deactivate a user session by useruid.
- **Authentication**: None
- **Request Body**:
```json
{
    "useruid": "testuser123"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "Session deactivated"
}
```
- **Sample Response (Session not found)**:
```json
{
    "message": "Session not found"
}
```

### 5. Verify JWT Token
- **Method**: `GET`
- **Endpoint**: `/api/sessions/verify-token`
- **Description**: Verifies the validity of a provided JWT.
- **Authentication**: None, the token is passed in the Authorization header.
- **Request Body**: None
- **Sample Response (Success)**:
```json
{
  "message": "Token is valid",
  "decoded": {
    "useruid": "testuser123",
    "iat": 1716633771,
    "exp": 1747593771
  }
}
```
-  **Sample Response (Invalid token)**:
```json
{
    "message": "Token is invalid"
}
```

---
## User Routes

### 1. Create User
- **Method**: `POST`
- **Endpoint**: `/api/users`
- **Description**: Creates a new user.
- **Authentication**: None
- **Request Body**:
```json
{
    "useruid": "testuser123",
    "username": "testuser",
    "useremail": "testuser@example.com"
}
```
- **Sample Response (Success)**:
```json
{
    "_id": "6651e16b0c0a92220d71c58d",
    "useruid": "testuser123",
    "username": "testuser",
    "useremail": "testuser@example.com",
}
```

### 2. Get User
- **Method**: `GET`
- **Endpoint**: `/api/users/:useruid`
- **Description**: Retrieves a user by their `useruid`.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
{
    "_id": "6651e16b0c0a92220d71c58d",
    "useruid": "testuser123",
    "username": "testuser",
    "useremail": "testuser@example.com"
}
```
### 3. Update User
- **Method**: `PUT`
- **Endpoint**: `/api/users/:useruid`
- **Description**: Updates an existing user by their `useruid`.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**:
```json
{
  "username": "updatedTestuser",
  "useremail": "updatedTestuser@example.com"
}
```
- **Sample Response**:
```json
{
    "_id": "6651e16b0c0a92220d71c58d",
    "useruid": "testuser123",
    "username": "updatedTestuser",
    "useremail": "updatedTestuser@example.com"
}
```

### 4. Delete User
- **Method**: `DELETE`
- **Endpoint**: `/api/users/:useruid`
- **Description**: Deletes a user by their `useruid`.
- **Authentication**: Requires a valid JWT in the `Authorization` header.
- **Request Body**: None
- **Sample Response**:
```json
{
    "message": "User deleted"
}
```

---
## Waitlist Routes

### 1. Join Waitlist
- **Method**: `POST`
- **Endpoint**: `/api/waitlist/join`
- **Description**: Adds an email to the waitlist.
- **Authentication**: None
- **Request Body**:
```json
{
  "email": "test@gmail.com"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "You have been added to the waitlist successfully, confirmation email sent."
}
```
- **Sample Response (Already in waitlist)**:
```json
{
    "message": "You are already in the waitlist, keep checking your inbox if access is given."
}
```
### 2. Grant Access
- **Method**: `POST`
- **Endpoint**: `/api/waitlist/grantaccess`
- **Description**: Grants access to a user in the waitlist by email.
- **Authentication**: None
- **Request Body**:
```json
{
    "email": "test@gmail.com"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "Access granted successfully, email sent with link.",
    "accessLink": "https://play.google.com/apps/testing/project.aio.project24"
}
```
### 3. Submit Feedback
- **Method**: `POST`
- **Endpoint**: `/api/waitlist/feedback`
- **Description**: Submit feedback from the user.
- **Authentication**: None
- **Request Body**:
```json
{
    "email": "test@gmail.com",
    "feedback": "This is a test feedback"
}
```
- **Sample Response (Success)**:
```json
{
    "message": "Feedback submitted successfully, confirmation email sent."
}
```
---
## Extra Routes

### 1. Service Status
- **Method**: `GET`
- **Endpoint**: `/api/service`
- **Description**: Gets the backend service status.
- **Authentication**: None
- **Request Body**: None
- **Sample Response (Success)**:
```json
{
    "status": true,
    "message": "we are currently experiencing heavy load, try again later. we are working on it."
}
```

---
## Test Routes

### 1. Get Access Token
- **Method**: `POST`
- **Endpoint**: `/api/test/gmail/getAccessToken`
- **Description**: Tests fetching Gmail access token.
- **Authentication**: None
- **Request Body**:
```json
{
    "useruid": "testuser123"
}
```
- **Sample Response**:
```json
{
   "code": 200,
   "message": "Valid access token found",
   "accessToken": "your_access_token"
}
```
### 2. Get Refresh Token from Auth Code
- **Method**: `POST`
- **Endpoint**: `/api/test/gmail/getRefreshTokenFromAuthCode`
- **Description**: Tests fetching Gmail refresh token using auth code.
- **Authentication**: None
- **Request Body**:
```json
{
  "useruid": "testuser123",
  "authCode": "your_auth_code"
}
```
- **Sample Response (Success)**:
```json
{
    "code": 200,
    "message": "Successfully retrieved and stored refresh token",
    "refreshToken": "your_refresh_token"
}
```
### 3. Refresh Access Token
- **Method**: `POST`
- **Endpoint**: `/api/test/gmail/_refreshAccessToken`
- **Description**: Tests refreshing Gmail access token.
- **Authentication**: None
- **Request Body**:
```json
{
   "useruid": "testuser123",
   "refreshToken": "your_refresh_token"
}
```
- **Sample Response (Success)**:
```json
{
    "code": 200,
    "message": "Successfully refreshed token",
    "accessToken": "your_new_access_token"
}
```

---
## Vector Routes

### 1. Add Data to Pinecone
- **Method**: `POST`
- **Endpoint**: `/api/vectors/add`
- **Description**: Adds text data to the Pinecone vector database.
- **Authentication**: None
- **Request Body**:
```json
{
  "text": "This is a sample text to be added to the vector database"
}
```
- **Sample Response (Success)**:
```json
{
  "message": "Data added successfully",
  "id": "some-unique-id"
}
```
### 2. Query Data from Pinecone
- **Method**: `POST`
- **Endpoint**: `/api/vectors/query`
- **Description**: Queries the Pinecone vector database based on a message.
- **Authentication**: None
- **Request Body**:
```json
{
  "message": "query string",
  "queryParams": {
    "topK": 5,
    "includeValues": true,
    "includeMetadata": true
  }
}
```
- **Sample Response (Success)**:
```json
{
    "results": [
        {
            "id": "some-unique-id",
            "text": "This is a sample text to be added to the vector database",
            "score": 0.99
        }
    ]
}
```
### 3. Classify Text
- **Method**: `POST`
- **Endpoint**: `/api/vectors/classify`
- **Description**: Classifies a text using a classification service.
- **Authentication**: None
- **Request Body**:
```json
{
  "text": "classify me now"
}
```
- **Sample Response (Success)**:
```json
{
    "classification": "does not require context"
}
```
