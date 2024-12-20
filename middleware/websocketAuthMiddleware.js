// FILE: middleware/websocketAuthMiddleware.js
const jwt = require('jsonwebtoken');
const { ERROR_CODES } = require('../config/constants');
const dotenv = require('dotenv');
dotenv.config();

const websocketAuthMiddleware = (socket, next) => {
  console.log("ws auth middleware: Initiating authentication");
  
  if (
    !socket.handshake ||
    !socket.handshake.auth ||
    !socket.handshake.auth.token
  ) {
    console.error("Authentication error: No token provided or invalid handshake");
    return next(new Error(ERROR_CODES.INVALID_TOKEN));
  }

  const token = socket.handshake.auth.token;
  console.log("Received token:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", decoded);
    socket.user = decoded; // Attach the decoded user to the socket object
    console.log("ws user", socket.user);
    next();
  } catch (error) {
    console.error('Authentication error: Invalid token', error);
    next(new Error(ERROR_CODES.INVALID_TOKEN));
  }
};

module.exports = websocketAuthMiddleware;