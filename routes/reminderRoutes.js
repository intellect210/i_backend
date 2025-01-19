const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all schedules for a user
router.get('/', authMiddleware, reminderController.getAllSchedules);

// Delete a schedule using _id
router.delete(
  '/:_id', // Changed from reminderId to _id
  authMiddleware,
  reminderController.deleteSchedule
);

module.exports = router;