const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/controller-session');
const authMiddleware = require('../middleware/middleware-auth');


// POST /login - Handle user login
router.post('/jwtcreation', sessionController.sessionManager);

// POST /logout - Handle user logout

// POST /activate - Activate a session
router.post('/activate', sessionController.activateSession);

// POST /deactivate - Deactivate a session
router.post('/deactivate', sessionController.deactivateSession);

// GET /verify-token - Verify JWT token
router.get('/verify-token', sessionController.verifyJwt);

router.use(authMiddleware);

router.post('/logout', authMiddleware, sessionController.logout);


module.exports = router;