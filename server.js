// FILE: server.js
const { createServer } = require('http');
const { Server } = require('ws');
const express = require('express');

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

const app = express();
const server = createServer(app);

const wss = new Server({ noServer: true });

// Error handling middleware (example)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

// Upgrade HTTP connection to WebSocket
server.on('upgrade', (request, socket, head) => {
  console.log('upgrade event');
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log('emit connection event');
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', async (ws, request) => {
  // Use the authentication middleware to verify the token
  websocketAuthMiddleware(ws, (err) => {
    // if (err) {
    //   handleInvalidTokenError(err, ws);
    // } else {
      // Handle new connection
      websocketService.handleNewConnection(ws, request);
    // }
  });
});

const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();
  await connectRedis();

  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})();