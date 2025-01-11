// FILE: config/constants.js
const MESSAGE_TYPES = {
  TEXT: 'text',
  CHUNK: 'chunk',
  CHUNK_END: 'chunk_end',
  ERROR: 'error'
};

const MESSAGE_ROLES = {
  USER: 'user',
  BOT: 'bot',
};

const ERROR_CODES = {
  // General Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  MESSAGE_VALIDATION_ERROR: 'MESSAGE_VALIDATION_ERROR',
  BOT_RESPONSE_ERROR: 'BOT_RESPONSE_ERROR',

  // Specific Errors
  TOKEN_ENCRYPTION_ERROR: 'TOKEN_ENCRYPTION_ERROR',
  TOKEN_DECRYPTION_ERROR: 'TOKEN_DECRYPTION_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  DUPLICATE_USER: 'DUPLICATE_USER',
  INVALID_REQUEST: 'INVALID_REQUEST',
  CONSECUTIVE_USER_MESSAGE: 'CONSECUTIVE_USER_MESSAGE',
    EMPTY_MESSAGE: 'EMPTY_MESSAGE',
    BOT_RESPONSE_TIMEOUT: 'BOT_RESPONSE_TIMEOUT',
    STREAM_ERROR: 'STREAM_ERROR'
};

const BOT_RESPONSE_TIMEOUT_MS = 1000; // 1 seconds

const MODELS = {
  GEMINI_PRO: "gemini-1.5-pro",
  GEMINI_105_FLASH_8B: "gemini-1.5-flash-8b",
  GEMINI_105_FLASH: "gemini-2.0-flash-exp",
  // GEMINI_105_FLASH: "gemini-1.5-flash",
  GEMINI_EXP_1206: "gemini-exp-1206",
  GEMINI_20_FLASH: "gemini-2.0-flash-exp",
  GEMINI_TUNED_I1_CONVO_T1: "tunedModels/i1convot1-njdey2vs1v7d",
  VERTEX_MODEL_NAME: "text-embedding-004",
  // Add other models here
};

// Define preference keys
const PREFERENCE_KEYS = {
  NOTIFICATION_PERMISSION: 'NOTIFICATION_PERMISSION',
  DARK_MODE: 'DARK_MODE',
  GMAIL_PERMISSION: 'GMAIL_PERMISSION',
  PERSONAL_MODE: 'PERSONAL_MODE',
  GS_GMAIL_ENABLED: 'GS_GMAIL_ENABLED',
  GS_CALENDAR_ENABLED: 'GS_CALENDAR_ENABLED',
  GS_CALENDAR_PERMISSION: 'GS_CALENDAR_PERMISSION',
  // Add more preference keys here
};

const CURRENT_MODEL = MODELS.GEMINI_105_FLASH;

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  MESSAGE_TYPES,
  MESSAGE_ROLES,
  ERROR_CODES,
  BOT_RESPONSE_TIMEOUT_MS,
  MODELS,
  CURRENT_MODEL,
  NODE_ENV,
  PREFERENCE_KEYS
};