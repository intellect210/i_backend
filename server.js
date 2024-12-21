// FILE: server.js
const { createServer } = require("http");
const { Server } = require("ws");
const express = require("express");
const dotenv = require('dotenv');
const { v4: uuidv4 } = require("uuid");
dotenv.config();

const connectDB = require("./config/dbConfig");
const { connectRedis } = require("./config/redisConfig");
const websocketAuthMiddleware = require("./middleware/websocketAuthMiddleware");
const websocketService = require("./services/websocketService");
const {
  handleDatabaseError,
  handleRedisError,
  handleInvalidTokenError,
  handleWebsocketError,
} = require("./utils/errorHandlers");
const logger = require("./utils/logger");

// Import your existing routes
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
const server = createServer(app);

const wss = new Server({ noServer: true });

// Error handling middleware (example)
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

// *** IMPORTANT: Add middleware to parse JSON request bodies ***
app.use(express.json());

// *** Mount your routes ***
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);

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

wss.on("connection", async (ws, request) => {
  // Generate a unique socket ID
  ws.id = uuidv4();

  websocketAuthMiddleware(ws, request, async (err) => {
    if (err) {
      handleInvalidTokenError(err, ws);
    } else {
      // Authentication successful, proceed with connection
      const userId = ws.user.useruid;
      console.log("userId", userId);

      // Send initial message with authentication details (e.g., token)
      const initialMessage = {
        type: 'auth',
        token: ws.token, // Assuming the token is stored in ws.token by the middleware
      };

      // Pass the initial message to handleNewConnection
      await websocketService.handleNewConnection(ws, userId, initialMessage);
    }
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