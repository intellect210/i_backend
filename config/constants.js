// FILE: config/constants.js
module.exports = {
  MESSAGE_TYPES: {
    TEXT: 'text',
    // Add more types as needed (e.g., IMAGE, VIDEO, etc.)
  },
  MESSAGE_ROLES: {
    USER: 'user',
    BOT: 'bot',
  },
  ERROR_CODES: {
    INVALID_TOKEN: 'INVALID_TOKEN',
    DATABASE_ERROR: 'DATABASE_ERROR',
    REDIS_ERROR: 'REDIS_ERROR',
    WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
    CONSECUTIVE_USER_MESSAGE: 'CONSECUTIVE_USER_MESSAGE',
    EMPTY_MESSAGE: 'EMPTY_MESSAGE',
    BOT_RESPONSE_TIMEOUT: 'BOT_RESPONSE_TIMEOUT',
  },
  BOT_RESPONSE_TIMEOUT_MS: 10000, // 10 seconds
  
  MODELS: {
    GEMINI_PRO: "gemini-1.5-pro",
    GEMINI_105_FLASH_8B: "gemini-1.5-flash-8b",
    GEMINI_105_FLASH: "gemini-1.5-flash",
    GEMINI_EXP_1206: "gemini-exp-1206",
    GEMINI_20_FLASH: "gemini-2.0-flash-exp",
    // Add other models here
  },
};