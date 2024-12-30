const { createServer } = require("http");
const { Server } = require("ws");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
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
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const extraRoutes = require("./routes/extraRoutes");
const vectorRoutes = require("./routes/vectorRoutes");
const personalizationRoutes = require("./routes/personalizationRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");

const app = express();
const server = createServer(app);

const wss = new Server({ noServer: true });

// Configure CORS
const corsOptions = {
  origin: "https://project24-f0148.web.app", // Replace with your frontend URL
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions)); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Mount your routes
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/status", extraRoutes);
app.use("/api/personalization", personalizationRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  res.status(statusCode).json({ code, message: "Something broke!" });
});

// Handle WebSocket upgrade
server.on("upgrade", (request, socket, head) => {
  console.log("upgrade event");

  // Create a new object to store authentication-related headers
  request.authHeaders = {};
  const authHeaderIndex = request.rawHeaders.indexOf("Authorization");
  if (authHeaderIndex !== -1) {
    request.authHeaders["Authorization"] = request.rawHeaders[authHeaderIndex + 1];
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log("emit connection event");
    wss.emit("connection", ws, request);
  });
});

// WebSocket connection handling
wss.on("connection", async (ws, request) => {
  ws.id = uuidv4();

  websocketAuthMiddleware(ws, request, async (err) => {
    if (err) {
      handleInvalidTokenError(err, ws);
    } else {
      const userId = ws.user.useruid;
      console.log("userId", userId);

      const initialMessage = {
        type: "auth",
        token: ws.token, // Assuming the token is stored in ws.token by the middleware
      };

      await websocketService.handleNewConnection(ws, userId, initialMessage);
    }
  });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    await connectRedis();
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start the server:", error);
    process.exit(1);
  }
})();
