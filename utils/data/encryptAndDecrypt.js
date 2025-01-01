// I_BACKEND/utils/data/encryptAndDecrypt.js
const crypto = require('crypto');
const config = require('../../config/config'); // Import config

const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = config.encryptionKey; // Get key from config

const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

function encrypt(text) {
    try {
        const iv = crypto.randomBytes(16); // Generate a new IV for each encryption
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.log('Encryption error:', error);
        return null; // Handle encryption failure gracefully
    }
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = textParts.join(':');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.log('Decryption error:', error);
        return null; // Handle decryption failure gracefully
    }
}

module.exports = {
    encrypt,
    decrypt,
};