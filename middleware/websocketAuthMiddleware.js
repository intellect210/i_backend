// FILE: middleware/websocketAuthMiddleware.js
const jwt = require('jsonwebtoken');
const { ERROR_CODES } = require('../config/constants');
const dotenv = require('dotenv');
dotenv.config();

const websocketAuthMiddleware = (ws, request, next) => {
  console.log("ws auth middleware: Initiating authentication");

  // Access headers from the request.authHeaders object
  const authHeader = request.authHeaders['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error("Authentication error: No token provided or invalid format");
    ws.close(4001, "Unauthorized: No token provided or invalid format");
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.user = decoded;
    ws.token = token;
    console.log("ws user", ws.user);
    next();
  } catch (error) {
    console.error("Authentication error: Invalid token");
    ws.close(4001, "Unauthorized: Invalid token");
    return;
  }
};

module.exports = websocketAuthMiddleware;