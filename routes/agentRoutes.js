const express = require('express');
const router = express.Router();
const agentController = require('../controllers/controller-agent');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/agents/gs/gmail/settokens/:useruid - Set Gmail tokens for a user
router.post('/gs/gmail/settokens/:useruid', authMiddleware, agentController.setGmailTokens);

module.exports = router;