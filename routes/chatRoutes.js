const express = require('express');
const router = express.Router();
const chatController = require('../controllers/controller-chat');
const authMiddleware = require('../middleware/middleware-auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get('/', chatController.getAllChats);

router.delete('/deletechat/:chatId', chatController.deleteChat);

module.exports = router;