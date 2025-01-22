const crypto = require('crypto');

// Generate a 32-byte (256-bit) random key for AES-256
const key = crypto.randomBytes(32).toString('hex');

console.log("Your AES_ENCRYPTION_KEY:", key);