// FILE: controllers/controller-user.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Notification = require('../models/notificationModel'); // Import Notification model
const { ERROR_CODES } = require('../config/config-constants'); // Import error codes

// Create a new user or return an existing one
const createUser = async (req, res) => {
  try {
    console.log('Create user request received:', req.body);
    const { username, useremail } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ useremail: useremail });
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(201).json(existingUser);
    }

    // Create a new user if one does not exist
    const user = new User(req.body);
    await user.save();
    console.log('New user created:', user);
    res.status(201).json(user);
  } catch (error) {
    // console.error('Error creating user:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Get a user by useruid
const getUser = async (req, res) => {
  try {
    console.log('Get user request received for useruid:', req.params.useruid);
    const user = await User.findOne({ useruid: req.params.useruid });
    if (!user) {
      console.log('User not found for useruid:', req.params.useruid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user);
    res.json(user);
  } catch (error) {
    // console.error('Error getting user:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Update a user by useruid
const updateUser = async (req, res) => {
  try {
    console.log('Update user request received for useruid:', req.params.useruid, 'with data:', req.body);
    const user = await User.findOneAndUpdate(
      { useruid: req.params.useruid },
      req.body,
      { new: true }
    );
    if (!user) {
      console.log('User not found for update with useruid:', req.params.useruid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User updated:', user);
    res.json(user);
  } catch (error) {
    // console.error('Error updating user:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// Delete a user by useruid
const deleteUser = async (req, res) => {
  try {
    console.log('Delete user request received for useruid:', req.params.useruid);
    const user = await User.findOneAndDelete({
      useruid: req.params.useruid,
    });
    if (!user) {
      console.log('User not found for deletion with useruid:', req.params.useruid);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User deleted:', user);
    res.json({ message: 'User deleted' });
  } catch (error) {
    // console.error('Error deleting user:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Function to generate a JWT token for testing
const generateTestToken = (req, res) => {
  try {
    const useruid = req.params.useruid;
    console.log('generateTestToken called');
    console.log('useruid:', useruid);

    if (!useruid) {
      return res.status(400).json({ message: 'User UID is required' });
    }

    // Generate a JWT token
    const token = jwt.sign({ useruid: useruid }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    console.log('Generated token in userController:', token);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating test token:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Set or Update FCM token for a user
const setFcmToken = async (req, res) => {
    try {
        const { useruid } = req.params;
        const { fcmToken } = req.body;

        if (!fcmToken) {
           console.error('[DEBUG: userController] FCM token is missing');
            return res.status(400).json({ code: ERROR_CODES.INVALID_REQUEST, message: 'FCM token is required' });
        }
        console.log(`[DEBUG: userController] setFcmToken called with useruid: ${useruid}`);
        const user = await User.findOne({ useruid: useruid });
         if (!user) {
           console.error(`[DEBUG: userController] User not found for useruid: ${useruid}`);
             return res.status(404).json({ code: ERROR_CODES.USER_NOT_FOUND, message: 'User not found' });
        }

        let notificationRecord = await Notification.findOne({ user: user._id });

        if (notificationRecord) {
            console.log(`[DEBUG: userController] Existing fcm token found, updating token for user: ${useruid}`);
            notificationRecord.fcmToken = fcmToken;
        } else {
            console.log(`[DEBUG: userController] No fcm token found, creating a new record for user: ${useruid}`);
            notificationRecord = new Notification({
                user: user._id,
                fcmToken: fcmToken
            });
        }
        
        await notificationRecord.save();
        console.log(`[DEBUG: userController] Fcm token saved successfully for user: ${useruid}`);
        res.status(200).json({ message: 'FCM token set successfully' });
    } catch (error) {
        console.error('[DEBUG: userController] Error setting FCM token:', error);
        if (error.name === 'ValidationError') {
           return res.status(400).json({ code: ERROR_CODES.MESSAGE_VALIDATION_ERROR, message: error.message });
         }
        return res.status(500).json({ code: ERROR_CODES.DATABASE_ERROR, message: 'Database error', error: error.message });
    }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  generateTestToken,
  setFcmToken
};