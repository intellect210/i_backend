const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get('/:useruid/getallmessages/:chatId', messageController.getAllMessages);

module.exports = router;