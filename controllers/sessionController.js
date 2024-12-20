const Session = require('../models/sessionModel');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Function to generate JWT
const generateJwt = (useruid) => {
    const token = jwt.sign({ useruid }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
    return token;
};

// Function to handle session management (login)
const sessionManager = async (req, res) => {
  try {
    const { useruid, deviceInfo } = req.body;

    if (!useruid) {
      return res.status(400).json({ message: 'useruid is required' });
    }

    let session = await Session.findOne({ useruid });

    if (session) {
      // Update existing session
      session.token = generateJwt(useruid);
      session.deviceInfo = deviceInfo;
      session.isActive = true;
      session.lastLogin = Date.now();
      await session.save();
      return res.status(200).json({ message: 'Session updated', token: session.token });
    } else {
      // Create new session
      const token = generateJwt(useruid);
      const newSession = new Session({
        useruid,
        token,
        deviceInfo,
      });
      await newSession.save();
      return res.status(201).json({ message: 'Session created', token });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Function to handle user logout
const logout = async (req, res) => {
  try {
    const { useruid } = req.body;

    if (!useruid) {
      return res.status(400).json({ message: 'useruid is required' });
    }

    const session = await Session.findOne({ useruid });

    if (session) {
      session.isActive = false;
      await session.save();
      res.status(200).json({ message: 'Logged out successfully' });
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Function to activate a session
const activateSession = async (req, res) => {
    try {
      const { useruid } = req.body;
  
      if (!useruid) {
        return res.status(400).json({ message: 'useruid is required' });
      }
  
      const session = await Session.findOne({ useruid });
  
      if (session) {
        session.isActive = true;
        await session.save();
        res.status(200).json({ message: 'Session activated' });
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
  
  // Function to deactivate a session
  const deactivateSession = async (req, res) => {
    try {
      const { useruid } = req.body;
  
      if (!useruid) {
        return res.status(400).json({ message: 'useruid is required' });
      }
  
      const session = await Session.findOne({ useruid });
  
      if (session) {
        session.isActive = false;
        await session.save();
        res.status(200).json({ message: 'Session deactivated' });
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
  
  // Function to verify JWT token
  const verifyJwt = (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  
      if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.status(200).json({ message: 'Token is valid', decoded });
    } catch (error) {
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