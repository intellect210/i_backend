const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware)

// POST /login - Handle user login
router.post('/jwtcreation', sessionController.sessionManager);

// POST /logout - Handle user logout
router.post('/logout', sessionController.logout);

// POST /activate - Activate a session
router.post('/activate', sessionController.activateSession);

// POST /deactivate - Deactivate a session
router.post('/deactivate', sessionController.deactivateSession);

// GET /verify-token - Verify JWT token
router.get('/verify-token', sessionController.verifyJwt);

module.exports = router;