const { verifyJwt } = require('../controllers/sessionController'); // Import verifyJwt
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = (req, res, next) => {
    console.log('Auth middleware invoked');

    console.log('Request headers:', req.headers);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
    console.log('Extracted token:', token);
    
    if (token) {
        try {
            console.log('Verifying token...');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified, decoded payload:', decoded);
            
            req.user = decoded;
            return next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    }
    
    console.warn('No token provided');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
};

module.exports = authMiddleware;