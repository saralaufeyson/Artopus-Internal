// backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

// Make sure to add JWT_SECRET to your .env file
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

module.exports = generateToken;