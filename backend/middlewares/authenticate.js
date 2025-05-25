const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { AuthenticationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }
    
    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      emailVerified: user.emailVerified
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;