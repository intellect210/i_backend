const { verifyJwt } = require('../controllers/sessionController'); // Import verifyJwt

const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // Use the verifyJwt function to verify the token
  try {
    const decoded = verifyJwt(req, res); // Pass req and res to verifyJwt
    // Attach decoded user information to the request object
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;