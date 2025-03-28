const express = require('express');
const router = express.Router();

// Import all the route files
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const sessionRoutes = require('./sessionRoutes');
const userRoutes = require('./userRoutes');
const agentRoutes = require('./agentRoutes');
const testRoutes = require('./testRoute');
const preferenceRoutes = require('./preferenceRoutes');
const reminderRoutes = require('./reminderRoutes');

// Use the routes
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/sessions', sessionRoutes);
router.use('/users', userRoutes);
router.use('/agents', agentRoutes);
router.use('/personalization', require('./personalizationRoutes'));
router.use('/preferences', preferenceRoutes);
router.use('/reminders', reminderRoutes);
// router.use('/test', testRoutes); // Use test routes


module.exports = router;