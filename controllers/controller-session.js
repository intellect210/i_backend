const Session = require('../models/sessionModel');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Function to generate JWT
const generateJwt = (useruid) => {
  console.log('Generating JWT for user:', useruid);
  const token = jwt.sign({ useruid }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
  console.log('JWT generated:', token);
  return token;
};

// Function to handle session management (login)
const sessionManager = async (req, res) => {
  try {
  const { useruid, deviceInfo } = req.body;
  console.log('Session manager called with useruid:', useruid);

  if (!useruid) {
    console.log('useruid is missing');
    return res.status(400).json({ message: 'useruid is required' });
  }

  let session = await Session.findOne({ useruid });
  console.log('Session found:', session);

  if (session) {
    // Update existing session
    console.log('Updating existing session for user:', useruid);
    session.token = generateJwt(useruid);
    session.deviceInfo = deviceInfo;
    session.isActive = true;
    session.lastLogin = Date.now();
    await session.save();
    console.log('Session updated successfully');
    return res.status(200).json({ message: 'Session updated', token: session.token });
  } else {
    // Create new session
    console.log('Creating new session for user:', useruid);
    const token = generateJwt(useruid);
    const newSession = new Session({
    useruid,
    token,
    deviceInfo,
    });
    await newSession.save();
    console.log('New session created successfully');
    return res.status(201).json({ message: 'Session created', token });
  }
  } catch (error) {
  // console.error('Error in sessionManager:', error);
  res.status(500).json({ error: error.message });
  }
};

// Function to handle user logout
const logout = async (req, res) => {
  try {
    const useruid = req.user.useruid; // Get useruid from verified token
    console.log('Logout called for useruid:', useruid);

    const session = await Session.findOne({ useruid });

    if (session) {
      // Deactivate the session
      session.isActive = false;
      await session.save();
      console.log('Session deactivated for user:', useruid);
      res.status(200).json({ message: 'Logged out successfully' });
    } else {
      console.log('Session not found for user:', useruid);
      // You can decide to return a 404 or a 200 here, based on your preference
      res.status(200).json({ message: 'Session not found, already logged out' }); //  200 OK since user is effectively logged out
    }
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: error.message });
  }
};

// Function to activate a session
const activateSession = async (req, res) => {
  try {
  const { useruid } = req.body;
  console.log('Activate session called with useruid:', useruid);

  if (!useruid) {
    console.log('useruid is missing');
    return res.status(400).json({ message: 'useruid is required' });
  }

  const session = await Session.findOne({ useruid });
  console.log('Session found:', session);

  if (session) {
    session.isActive = true;
    await session.save();
    console.log('Session activated successfully');
    res.status(200).json({ message: 'Session activated' });
  } else {
    console.log('Session not found for user:', useruid);
    res.status(404).json({ message: 'Session not found' });
  }
  } catch (error) {
  // console.error('Error in activateSession:', error);
  res.status(500).json({ error: error.message });
  }
};

// Function to deactivate a session
const deactivateSession = async (req, res) => {
  try {
  const { useruid } = req.body;
  console.log('Deactivate session called with useruid:', useruid);

  if (!useruid) {
    console.log('useruid is missing');
    return res.status(400).json({ message: 'useruid is required' });
  }

  const session = await Session.findOne({ useruid });
  console.log('Session found:', session);

  if (session) {
    session.isActive = false;
    await session.save();
    console.log('Session deactivated successfully');
    res.status(200).json({ message: 'Session deactivated' });
  } else {
    console.log('Session not found for user:', useruid);
    res.status(404).json({ message: 'Session not found' });
  }
  } catch (error) {
  // console.error('Error in deactivateSession:', error);
  res.status(500).json({ error: error.message });
  }
};

// Function to verify JWT token
const verifyJwt = (req, res) => {
  try {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  console.log('Verifying token:', token);

  if (!token) {
    console.log('Token not provided');
    return res.status(401).json({ message: 'Token not provided' });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token is valid:', decoded);
  res.status(200).json({ message: 'Token is valid', decoded });
  } catch (error) {
  // console.error('Error in verifyJwt:', error);
  res.status(401).json({ message: 'Token is invalid' });
  }
};

module.exports = {
  sessionManager,
  logout,
  activateSession,
  deactivateSession,
  verifyJwt,
};