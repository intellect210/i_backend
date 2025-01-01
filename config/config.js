// I_BACKEND/config/config.js
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 8080,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.AES_ENCRYPTION_KEY,
    redisUri: process.env.REDIS_URI,
    geminiApiKey: process.env.GEMINI_API_KEY,
    pineconeApiKey: process.env.PINECONE_API_KEY,
    pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
    remoteHost: process.env.REMOTE_HOST,
    remoteUser: process.env.REMOTE_USER,
    sshPrivateKey: process.env.SSH_PRIVATE_KEY
};