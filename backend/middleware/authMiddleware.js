// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // IMPORTANT: Use return here to prevent further execution
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error); // Log the error for debugging
      // IMPORTANT: Use return here to prevent further execution
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    // IMPORTANT: Use return here to prevent further execution
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.some(role => req.user.roles.includes(role))) {
      // IMPORTANT: Use return here to prevent further execution
      return res.status(403).json({ message: `User role ${req.user.roles} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };