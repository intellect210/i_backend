const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/middleware-auth');
const PreferenceManager = require('../utils/respositories/preferenceManager');
const { ERROR_CODES } = require('../config/config-constants');

const preferenceManager = new PreferenceManager();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Route to get a user preference
router.get('/:preferenceKey', async (req, res) => {
    try {
        const useruid = req.user.useruid;
        const { preferenceKey } = req.params;

        if (!preferenceKey) {
          console.log('[DEBUG: preferenceRoutes] Preference key is missing.');
          return res.status(400).json({ message: 'Preference key is required.' });
        }

        const preference = await preferenceManager.getPreference(useruid, preferenceKey);
        res.json({ [preferenceKey]: preference });

    } catch (error) {
        console.log('[DEBUG: preferenceRoutes] Error getting preference:', error);
        res.status(500).json({ message: 'Error getting preference', error: error.message });
    }
});

// Route to set a user preference
router.post('/', async (req, res) => {
    try {
        const useruid = req.user.useruid;
        const { preferenceKey, value } = req.body;

      if (!preferenceKey || value === undefined) {
          console.log('[DEBUG: preferenceRoutes] Preference key or value is missing.');
        return res.status(400).json({ message: 'Preference key and value are required.' });
        }

        await preferenceManager.setPreference(useruid, preferenceKey, value);
        res.json({ message: 'Preference set successfully' });
    } catch (error) {
        console.log('[DEBUG: preferenceRoutes] Error setting preference:', error);
      res.status(error.code && error.code !== ERROR_CODES.DATABASE_ERROR ? error.code : 500).json({ message: 'Error setting preference', error: error.message });
    }
});

// Route to get all preferences
router.get('/', async(req, res) => {
  try {
    const useruid = req.user.useruid;
    const preferences = await preferenceManager.getAllPreferences(useruid);
     res.json(preferences);
  } catch (error) {
        console.log('[DEBUG: preferenceRoutes] Error getting all preferences:', error);
      res.status(500).json({ message: 'Error getting all preferences', error: error.message });
    }
});

module.exports = router;