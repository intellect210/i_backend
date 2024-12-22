const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get('/', chatController.getAllChats);

router.delete('/deletechat/:chatId', chatController.deleteChat);

module.exports = router;