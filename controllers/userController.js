const User = require('../models/userModel');

// Create a new user
const createUser = async (req, res) => {
  try {
    console.log('Create user request received:', req.body);
    const { username, useremail } = req.body;

    const existingUser = await User.findOne({ useremail: useremail });
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(201).json(existingUser);
    }

    const user = new User(req.body);
    await user.save();
    console.log('New user created:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error.message);
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
    console.error('Error getting user:', error.message);
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
    console.error('Error updating user:', error.message);
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
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
};