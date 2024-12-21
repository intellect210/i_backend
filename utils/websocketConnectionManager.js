// FILE: utils/websocketConnectionManager.js
const logger = require('./logger');

// Use a Map to store connections by userId, with the value being another Map of socketId to ws objects
const connections = new Map();

const websocketConnectionManager = {
  addConnection: (userId, ws) => {
    console.log(`Adding connection for user ${userId} with socket id ${ws.id}`);

    if (!connections.has(userId)) {
      connections.set(userId, new Map());
    }
    connections.get(userId).set(ws.id, ws);

    logger.info(`WebSocket connection added for user ${userId}`);
    console.log(`Current active connections:`, connections);
  },

  removeConnection: (userId, socketId) => {
    console.log(`Removing connection for user ${userId} with socket id ${socketId}`);

    if (connections.has(userId)) {
      const userConnections = connections.get(userId);
      if (userConnections.has(socketId)) {
        const ws = userConnections.get(socketId);
        ws.close(1000, 'Normal Closure'); // Use ws.close() for a graceful closure
        userConnections.delete(socketId);
        if (userConnections.size === 0) {
          connections.delete(userId);
        }
        logger.info(`WebSocket connection removed for user ${userId}`);
      } else {
        console.log(`No connection found for socket id ${socketId}`);
      }
    } else {
      console.log(`No connections found for user ${userId}`);
    }

    console.log(`Current active connections:`, connections);
  },

  getConnection: (userId) => {
    console.log(`Getting connection for user ${userId}`);
    console.log(`Current active connections:`, connections);

    if (connections.has(userId)) {
      // Return the Map of connections for the user
      return connections.get(userId);
    } else {
      console.log(`No connection found for user ${userId}`);
      return null; // Or an empty Map if appropriate
    }
  },

  // you can add getAllConnections if needed

  // Ping-pong (heartbeat) can be implemented here if needed
};

module.exports = websocketConnectionManager;