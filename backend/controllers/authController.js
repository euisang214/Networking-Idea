/**
 * Authentication controller
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const UserModel = require('../models/user');
const logger = require('../utils/logger');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errorTypes');
const emailService = require('../services/emailService');

// Helper to generate tokens
const generateTokens = (user) => {
  // Create JWT access token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION || '24h',
      algorithm: 'HS256'
    }
  );

  // Create refresh token
  const refreshToken = jwt.sign(
    {
      sub: user.id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
      algorithm: 'HS256'
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: parseInt(process.env.JWT_EXPIRATION, 10) || 86400000
  };
};

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    const { email, password, first_name, last_name, role } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('Email is already registered');
    }

    // Create new user
    const user = await UserModel.create({
      email,
      password,
      first_name,
      last_name,
      role: role || 'seeker'
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, {
      first_name: user.first_name,
      verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${jwt.sign(
        { sub: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      )}`
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user and tokens
    res.status(201).json({
      message: 'User registered successfully',
      user,
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Don't return password hash
    delete user.password_hash;

    // Generate tokens
    const tokens = generateTokens(user);

    // Return user and tokens
    res.status(200).json({
      message: 'Login successful',
      user,
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Find user
      const user = await UserModel.findById(decoded.sub);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Return new tokens
      res.status(200).json({
        message: 'Token refreshed successfully',
        ...tokens
      });
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      throw new BadRequestError('Verification token is required');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find and verify user
      const user = await UserModel.findById(decoded.sub);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.is_verified) {
        return res.status(200).json({
          message: 'Email already verified',
          user
        });
      }

      // Update user verification status
      const updatedUser = await UserModel.verify(user.id);

      // Return updated user
      res.status(200).json({
        message: 'Email verified successfully',
        user: updatedUser
      });
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired verification token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await UserModel.findByEmail(email);
    
    // Don't reveal if email exists for security reasons
    if (user) {
      // Generate password reset token
      const resetToken = jwt.sign(
        { sub: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send password reset email
      await emailService.sendPasswordResetEmail(user.email, {
        first_name: user.first_name,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      });
    }

    // Always return success regardless of whether user exists
    res.status(200).json({
      message: 'Password reset instructions sent if email exists'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      throw new BadRequestError('Token and password are required');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await UserModel.findById(decoded.sub);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Update user password
      const updatedUser = await UserModel.update(user.id, { password });

      // Return updated user
      res.status(200).json({
        message: 'Password reset successfully',
        user: updatedUser
      });
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (for authenticated users)
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current password and new password are required');
    }

    // Change password
    const success = await UserModel.changePassword(userId, currentPassword, newPassword);
    
    if (!success) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Return success
    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already available from passport middleware
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side)
 */
exports.logout = async (req, res, next) => {
  try {
    // Logout is mostly client-side by clearing tokens
    res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
