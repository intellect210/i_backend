
// FILE: controllers/reminderController.txt
const Reminder = require('../models/reminderModel');
const {
  handleDatabaseError,
  handleRedisError,
} = require('../utils/errorHandlers');
const { ERROR_CODES } = require('../config/constants');
const SchedulerService = require('../services/schedulerService');
const schedulerService = new SchedulerService();
const logger = require('../utils/logger');

const reminderController = {
  async getAllSchedules(req, res) {
    try {
      const userId = req.user.useruid;

      console.log(
        `[DEBUG: reminderController] Fetching all reminders for user ID: ${userId}`
      );

      const reminders = await Reminder.find({ userId: userId });

      console.log(
        `[DEBUG: reminderController] Found ${reminders.length} reminders for user ID: ${userId}`
      );

      res.status(200).json(reminders);
    } catch (error) {
      console.error(
        `[DEBUG: reminderController] Error fetching all reminders:`,
        error
      );
      handleDatabaseError(
        error,
        error.code ? error.code : ERROR_CODES.DATABASE_ERROR,
        null,
        req.user.useruid
      );
      return res.status(500).json({ message: 'Error fetching reminders.' });
    }
  },

  async deleteSchedule(req, res) {
    const session = await Reminder.startSession();
    try {
      const { _id } = req.params;

      if (!_id) {
        console.log('[DEBUG: reminderController] Reminder ID is missing for deletion.');
        return res.status(400).json({ status: 'error', message: 'Reminder ID is required.' });
      }

      console.log(`[DEBUG: reminderController] Deleting reminder with ID: ${_id}`);

      session.startTransaction();

      const reminder = await Reminder.findOne({ _id }).session(session);
      if (!reminder) {
        console.log(`[DEBUG: reminderController] Reminder not found for ID: ${_id}`);
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ status: 'error', message: 'Reminder not found.' });
      }

      const result = await schedulerService.dissolveReminder(reminder.reminderId);
      if (!result.success) {
        throw new Error(result.message);
      }

      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ status: 'success', message: 'Reminder deleted successfully.' });
    } catch (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      console.error(`[DEBUG: reminderController] Error deleting reminder:`, error);
      handleDatabaseError(error, error.code ? error.code : ERROR_CODES.DATABASE_ERROR, null, req.user ? req.user.useruid : null);
      return res.status(500).json({ status: 'error', message: 'Error deleting reminder.' });
    }
  },

};

module.exports = reminderController;