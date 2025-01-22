const express = require('express');
const router = express.Router();
const messageController = require('../controllers/controller-message');
const authMiddleware = require('../middleware/middleware-auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

router.get('/:useruid/getallmessages/:chatId', messageController.getAllMessages);

module.exports = router;