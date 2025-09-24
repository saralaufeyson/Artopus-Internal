// backend/controllers/userController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // We'll create this next!

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public (for initial admin setup, later restrict)
const registerUser = async (req, res) => {
  const { username, email, password, firstName, lastName, roles } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all required fields: username, email, password' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      username,
      email,
      password, // Mongoose pre-save hook will hash this
      firstName,
      lastName,
      roles: roles || ['data_entry'], // Default to data_entry if no roles provided
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        token: generateToken(user._id), // Generate JWT token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    // Handle Mongoose validation errors or other database errors
    if (error.code === 11000) { // Duplicate key error (e.g., username or email not unique)
      return res.status(400).json({ message: 'Username or email already in use' });
    }
    res.status(500).json({ message: error.message });
  }
};


// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  try {
    // Find user by email, and explicitly select password as it's set to select: false in schema
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Your account is inactive. Please contact an administrator.' });
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  // req.user will be available from the 'protect' middleware
  try {
    const user = await User.findById(req.user._id).select('-password'); // Exclude password
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        isActive: user.isActive,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { registerUser, loginUser, getUserProfile };