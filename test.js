// FILE: test.txt
const WebSocket = require('ws');
const fetch = require('node-fetch'); // Or another HTTP client like axios
const { createServer } = require('http');
const { Server } = require('ws');
const express = require('express'); // Import express

const connectDB = require('./config/dbConfig');
const { connectRedis } = require('./config/redisConfig');
const websocketAuthMiddleware = require('./middleware/websocketAuthMiddleware');
const websocketService = require('./services/websocketService');
const {
  handleDatabaseError,
  handleRedisError,
  handleInvalidTokenError,
  handleWebsocketError,
} = require('./utils/errorHandlers');
const logger = require('./utils/logger');
const jwt = require('jsonwebtoken');
const { MESSAGE_TYPES, MESSAGE_ROLES } = require('./config/constants');

// Assuming your server runs on this port
const PORT = process.env.PORT || 3000;
const SERVER_URL = `ws://localhost:${PORT}`;

// Replace with a valid user ID and JWT secret for testing
const TEST_USER_ID = 'testuser123';
const JWT_SECRET = process.env.JWT_SECRET; // Use the same secret as in your .env

// Generate a test JWT
const TEST_TOKEN = jwt.sign({ useruid: TEST_USER_ID }, JWT_SECRET, {
  expiresIn: '1h',
});

// --- Helper Functions ---

const createWebSocketClient = (token) => {
  return new WebSocket(SERVER_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// --- Test Cases ---

describe('Chatbot Backend Tests', () => {
  let server;
  let wss;

  beforeAll(async () => {
    // Connect to the database and Redis before running tests
    await connectDB();
    await connectRedis();

    const app = express();
    server = createServer(app);

    wss = new Server({ noServer: true });

    // Upgrade HTTP connection to WebSocket
    server.on('upgrade', (request, socket, head) => {
      console.log('upgrade event');

      // Create a new object to store authentication-related headers
      request.authHeaders = {};
      const authHeaderIndex = request.rawHeaders.indexOf('Authorization');
      if (authHeaderIndex !== -1) {
        request.authHeaders['Authorization'] = request.rawHeaders[authHeaderIndex + 1];
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('emit connection event');
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', async (ws, request) => {
      // Use the authentication middleware to verify the token
      websocketAuthMiddleware(ws, request, (err) => {
        if (err) {
          handleInvalidTokenError(err, ws);
        } else {
          // Handle new connection
          websocketService.handleNewConnection(ws, request);
        }
      });
    });

    await new Promise((resolve) => {
      server.listen(PORT, () => {
        logger.info(`Test server is running on port ${PORT}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Close the WebSocket server and disconnect from the database after tests
    if (wss) {
      await new Promise((resolve) => wss.close(resolve));
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Add any necessary cleanup for database and Redis connections if needed
  });

  it('should establish a WebSocket connection with a valid token', (done) => {
    const ws = createWebSocketClient(TEST_TOKEN);

    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
      done();
    });

    ws.on('error', (err) => {
      done(err); // Fail the test if there's an error
    });
  });

  it('should reject a WebSocket connection with an invalid token', (done) => {
    const ws = createWebSocketClient('invalid-token');

    ws.on('open', () => {
      // This should not happen with an invalid token
      done(new Error('Connection should have been rejected'));
    });

    ws.on('close', (code) => {
      expect(code).toBe(1008); // 1008 indicates policy violation (invalid token)
      done();
    });

    ws.on('error', (err) => {
      done(err); // Fail the test if there's an error
    });
  });

  it('should echo a message sent to the bot', (done) => {
    const ws = createWebSocketClient(TEST_TOKEN);
  
    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          messageType: MESSAGE_TYPES.TEXT,
          message: 'Hello bot!',
          receiver: 'bot',
        })
      );
    });
  
    ws.on('message', (data) => {
      const receivedMessage = JSON.parse(data);
      expect(receivedMessage.message).toBe('Hello bot!');
      expect(receivedMessage.role).toBe(MESSAGE_ROLES.BOT);
      ws.close();
      done();
    });
  
    ws.on('error', (err) => {
      done(err); // Fail the test if there's an error
    });
  });

  it('should store messages in the database', async () => {
    // Use a different test user to avoid potential conflicts with other tests
    const testUserId = 'testuser-db-check';
    const testToken = jwt.sign({ useruid: testUserId }, JWT_SECRET, {
      expiresIn: '1h',
    });

    const ws = createWebSocketClient(testToken);

    const testMessage = 'This is a test message for the database.';
    const messageSent = new Promise((resolve) => {
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            messageType: MESSAGE_TYPES.TEXT,
            message: testMessage,
            receiver: 'bot',
          })
        );
        resolve();
      });
    });

    await messageSent; // Wait for the message to be sent

    // Wait for a short time to allow the server to process the message
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Now check the database for the message
    const Chat = require('./models/chatModel'); // Import your Chat model
    const chatMessages = await Chat.find({
      userId: testUserId,
      'messages.text': testMessage,
    });

    expect(chatMessages.length).toBeGreaterThan(0);
    expect(chatMessages[0].messages[0].text).toBe(testMessage);
    expect(chatMessages[0].messages[0].role).toBe(MESSAGE_ROLES.USER);

    ws.close();
  });

  it('should handle disconnections and store unsent messages in Redis', (done) => {
    const ws = createWebSocketClient(TEST_TOKEN);
  
    ws.on('open', () => {
      // Simulate a disconnection before sending a message
      ws.close();
  
      // Try to send a message after disconnection (it should be stored in Redis)
      ws.send(
        JSON.stringify({
          messageType: MESSAGE_TYPES.TEXT,
          message: 'This message should be stored in Redis',
          receiver: 'bot',
        })
      );
  
      // Wait a short time to allow the server to process the disconnection
      setTimeout(async () => {
        // Check Redis for the unsent message
        const { redisClient } = require('./config/redisConfig');
        const unsentMessages = await redisClient.lRange(
          `unsent:${TEST_USER_ID}`,
          0,
          -1
        );
  
        expect(unsentMessages.length).toBe(1);
        const message = JSON.parse(unsentMessages[0]);
        expect(message.message).toBe('This message should be stored in Redis');
        done();
      }, 500); // Adjust timeout as needed
    });
  
    ws.on('error', (err) => {
      done(err);
    });
  });
});