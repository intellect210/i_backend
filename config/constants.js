// FILE: config/constants.txt
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
  INVALID_TOKEN: 'INVALID_TOKEN',
    DATABASE_ERROR: 'DATABASE_ERROR',
    REDIS_ERROR: 'REDIS_ERROR',
    WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
    CONSECUTIVE_USER_MESSAGE: 'CONSECUTIVE_USER_MESSAGE',
    EMPTY_MESSAGE: 'EMPTY_MESSAGE',
    BOT_RESPONSE_TIMEOUT: 'BOT_RESPONSE_TIMEOUT',
    BOT_RESPONSE_ERROR: 'BOT_RESPONSE_ERROR',
    STREAM_ERROR: 'STREAM_ERROR'
};

const BOT_RESPONSE_TIMEOUT_MS = 1000; // 1 seconds

const MODELS = {
  GEMINI_PRO: "gemini-1.5-pro",
  GEMINI_105_FLASH_8B: "gemini-1.5-flash-8b",
  GEMINI_105_FLASH: "gemini-1.5-flash",
  GEMINI_EXP_1206: "gemini-exp-1206",
  GEMINI_20_FLASH: "gemini-2.0-flash-exp",
  GEMINI_TUNED_I1_CONVO_T1: "tunedModels/i1convot1-njdey2vs1v7d",
  // Add other models here
};

const CURRENT_MODEL = MODELS.GEMINI_105_FLASH;

module.exports = {
  MESSAGE_TYPES,
  MESSAGE_ROLES,
  ERROR_CODES,
  BOT_RESPONSE_TIMEOUT_MS,
  MODELS,
  CURRENT_MODEL
};