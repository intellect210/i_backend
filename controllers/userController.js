const User = require('../models/userModel');

// Create a new user
const createUser = async (req, res) => {
  try {
    const { username, useremail } = req.body;

    const existingUser = await User.findOne({ useremail: useremail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a user by useruid
const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ useruid: req.params.useruid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a user by useruid
const updateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { useruid: req.params.useruid },
      req.body,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a user by useruid
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      useruid: req.params.useruid,
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
};