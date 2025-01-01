const express = require('express');
const router = express.Router();

// Import all the route files
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const sessionRoutes = require('./sessionRoutes');
const userRoutes = require('./userRoutes');
const agentRoutes = require('./agentRoutes');

// Use the routes
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/sessions', sessionRoutes);
router.use('/users', userRoutes);
router.use('/agents', agentRoutes);

module.exports = router;