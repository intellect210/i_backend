// FILE: utils/websocketConnectionManager.js
const logger = require('./logger');

const activeConnections = new Map();

const websocketConnectionManager = {
  addConnection: (userId, ws) => {
    activeConnections.set(userId, ws);
    logger.info(`WebSocket connection added for user ${userId}`);
  },

  removeConnection: (userId) => {
    const ws = activeConnections.get(userId);
    if (ws) {
      ws.terminate(); // Forcefully close the connection
      activeConnections.delete(userId);
      logger.info(`WebSocket connection removed for user ${userId}`);
    }
  },

  getConnection: (userId) => {
    return activeConnections.get(userId);
  },

  getAllConnections: () => {
    return activeConnections;
  },

  // Ping-pong (heartbeat) can be implemented here if needed
};

module.exports = websocketConnectionManager;