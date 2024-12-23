// FILE: utils/errorHandlers.txt
const { ERROR_CODES } = require('../config/constants');
const logger = require('./logger');
const { removeUserSession } = require('../services/redisService');
const websocketConnectionManager = require('./websocketConnectionManager');

const errorHandlers = {
  handleDatabaseError: (error, code = ERROR_CODES.DATABASE_ERROR, ws = null, userId = null) => {
    logger.error(`Database error (code: ${code}):`, error);
    if (ws) {
      ws.send(
        JSON.stringify({
          code,
          message: 'An error occurred with the database.',
        })
      );
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleRedisError: (error, code = ERROR_CODES.REDIS_ERROR, ws = null, userId = null) => {
    logger.error(`Redis error (code: ${code}):`, error);
    if (ws) {
      ws.send(
        JSON.stringify({
          code,
          message: 'An error occurred with Redis.',
        })
      );
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleWebsocketError: (error, code = ERROR_CODES.WEBSOCKET_ERROR, ws = null, userId = null) => {
    logger.error(`Websocket error (code: ${code}):`, error);
    if (ws) {
      ws.send(
        JSON.stringify({
          code,
          message: 'An error occurred with the WebSocket connection.',
        })
      );
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleInvalidTokenError: (error, code = ERROR_CODES.INVALID_TOKEN, ws = null, userId = null) => {
    logger.error(`Invalid token error (code: ${code}):`, error);
    if (ws) {
      ws.send(
        JSON.stringify({
          code,
          message: 'Invalid or expired token.',
        })
      );
      ws.close(4001, 'Invalid token'); // Close the WebSocket connection
    }
    if (userId) {
      websocketConnectionManager.removeConnection(userId);
      removeUserSession(userId);
    }
  },

  handleMessageValidationError: (error, code = ERROR_CODES.MESSAGE_VALIDATION_ERROR, ws = null, userId = null) => {
    logger.error(`Message validation error (code: ${code}):`, error);
    if (ws) {
      ws.send(
        JSON.stringify({
          code,
          message: error.message,
        })
      );
    }
    // Note: We are not removing the user session or closing the connection
    // on validation errors, as these might be temporary issues.
  },

  handleBotResponseError: (error, code = ERROR_CODES.BOT_RESPONSE_ERROR, ws = null, userId = null) => {
    logger.error(`Bot response error (code: ${code}):`, error);
    if (ws) {
      ws.send(
        JSON.stringify({
          code,
          message: 'An error occurred while generating the bot response.',
        })
      );
    }
    // Note: We are not removing the user session or closing the connection
    // on bot response errors, as these might be temporary issues.
  },
};

module.exports = errorHandlers;