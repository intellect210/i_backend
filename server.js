const config = require('./config/config-main'); // Import config
const express = require('express');
const mongoose = require('mongoose');
const winston = require('winston');
const cors = require('cors'); // Import CORS
const { createServer } = require('http');
const { Server } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { NODE_ENV } = require('./config/config-constants');
const routes = require('./routes/allRoutes');
const dbConfig = require('./config/config-db');
const websocketService = require('./services/websocketService');
const websocketAuthMiddleware = require('./middleware/middleware-websocketAuth');
const { connectRedis } = require('./config/config-redis');

const app = express();
const PORT = config.port; // Use config.port

// Setup Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// CORS configuration
const allowedOrigins = [
    'https://project-f0148.web.app',
    'https://intai.in',
    'http://intai.in',
    "http://project-f0148.web.app",
];

// Function to check if the request origin is allowed
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS')); // Block the request
        }
    },
    credentials: true, // If you need to allow credentials
};

app.use(cors(corsOptions)); // Use CORS middleware

// Middleware
app.use(express.json());

// API Routes
app.use('/api', routes);

const server = createServer(app);
const wss = new Server({ noServer: true });

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

// WebSocket connection handling
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

// Start the server
(async () => {
    await dbConfig.connectDB(); // Ensure MongoDB connection is established
    await connectRedis();
    server.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
})();

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
            logger.info('MongoDb connection closed.');
            process.exit(0);
        });
    });
});
