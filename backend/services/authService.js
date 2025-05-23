const User = require('../models/user');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const EmailService = require('./emailService');
const logger = require('../utils/logger');

class AuthService {
  // Register a new user
  async register(userData) {
    try {
      const { email, password, firstName, lastName, userType, resume } = userData;
      
      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        resume,
        userType: userType || 'candidate',
        emailVerificationToken: crypto.randomBytes(32).toString('hex')
      });
      
      await user.save();
      
      // Send verification email
      await EmailService.sendEmail(
        user.email,
        'Verify Your Email',
        'email-verification',
        {
          userName: `${user.firstName} ${user.lastName}`,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`
        }
      );
      
      logger.info(`User registered: ${user._id}`);
      
      return {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          resume: user.resume
        }
      };
    } catch (error) {
      logger.error(`Registration failed: ${error.message}`);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }
      
      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is inactive');
      }
      
      // Generate JWT token
      const token = this.generateToken(user);
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      logger.info(`User logged in: ${user._id}`);
      
      return {
        token,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      logger.error(`Login failed: ${error.message}`);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const user = await User.findOne({ emailVerificationToken: token });
      
      if (!user) {
        throw new Error('Invalid verification token');
      }
      
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      
      await user.save();
      
      logger.info(`Email verified for user: ${user._id}`);
      
      return {
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };
    } catch (error) {
      logger.error(`Email verification failed: ${error.message}`);
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        // Don't reveal if email exists
        return { success: true };
      }
      
      // Generate reset token
      user.passwordResetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      
      await user.save();
      
      // Send reset email
      await EmailService.sendEmail(
        user.email,
        'Reset Your Password',
        'password-reset',
        {
          userName: `${user.firstName} ${user.lastName}`,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${user.passwordResetToken}`
        }
      );
      
      logger.info(`Password reset requested for user: ${user._id}`);
      
      return { success: true };
    } catch (error) {
      logger.error(`Password reset request failed: ${error.message}`);
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      
      await user.save();
      
      logger.info(`Password reset for user: ${user._id}`);
      
      return { success: true };
    } catch (error) {
      logger.error(`Password reset failed: ${error.message}`);
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        userType: user.userType
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
      
      // Set new password
      user.password = newPassword;
      await user.save();
      
      logger.info(`Password changed for user: ${user._id}`);
      
      return { success: true };
    } catch (error) {
      logger.error(`Password change failed: ${error.message}`);
      throw new Error(`Password change failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService();