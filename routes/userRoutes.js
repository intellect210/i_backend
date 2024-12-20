const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST / - Create a new user
router.post('/', userController.createUser);

// GET /:useruid - Get a user by useruid
router.get('/:useruid', userController.getUser);

// PUT /:useruid - Update a user by useruid
router.put('/:useruid', userController.updateUser);

// DELETE /:useruid - Delete a user by useruid
router.delete('/:useruid', userController.deleteUser);

module.exports = router;