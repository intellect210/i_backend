const { ERROR_CODES } = require('../config/constants');
const logger = require('./logger');
const { removeUserSession } = require('../services/redisService');
const websocketConnectionManager = require('./websocketConnectionManager');

const errorHandlers = {
  handleDatabaseError: (error, ws = null, userId = null) => {
    logger.error('Database error:', error);
    if (ws) {
      ws.send(
        JSON.stringify({
          error: ERROR_CODES.DATABASE_ERROR,
          message: 'An error occurred with the database.',
        })
      );
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleRedisError: (error, ws = null, userId = null) => {
    logger.error('Redis error:', error);
    if (ws) {
      ws.send(
        JSON.stringify({
          error: ERROR_CODES.REDIS_ERROR,
          message: 'An error occurred with Redis.',
        })
      );
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleWebsocketError: (error, ws = null, userId = null) => {
    logger.error('Websocket error:', error);
    if (ws) {
      ws.send(
        JSON.stringify({
          error: ERROR_CODES.WEBSOCKET_ERROR,
          message: 'An error occurred with the WebSocket connection.',
        })
      );
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleInvalidTokenError: (error, ws = null, userId = null) => {
    logger.error('Invalid token error:', error);
    if (ws) {
      ws.send(
        JSON.stringify({
          error: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid or expired token.',
        })
      );
      ws.close(1008, 'Invalid token'); // Close the WebSocket connection
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleMessageValidationError: (error, ws = null, userId = null) => {
    logger.error('Message validation error:', error);
    if (ws) {
      ws.send(
        JSON.stringify({
          error: error.code, // Use the error code from the error object
          message: error.message, // Use the error message from the error object
        })
      );
    }
    // Note: We are not removing the user session or closing the connection
    // on validation errors, as these might be temporary issues.
  },
};

module.exports = errorHandlers;