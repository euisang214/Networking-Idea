const AuthService = require('../services/authService');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// Controller for authentication-related operations
const AuthController = {
  // Register a new user
  register: async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, userType } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('All fields are required');
      }
      
      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        userType
      });
      
      return responseFormatter.created(res, {
        user: result.user
      }, 'User registered successfully. Please check your email to verify your account.');
    } catch (error) {
      next(error);
    }
  },
  
  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }
      
      const result = await AuthService.login(email, password);
      
      return responseFormatter.success(res, {
        token: result.token,
        user: result.user
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  // Google authentication
  googleAuth: async (req, res, next) => {
    try {
      const { idToken, accessToken, refreshToken } = req.body;

      if (!idToken || !accessToken) {
        throw new ValidationError('Google tokens are required');
      }

      const result = await AuthService.googleLogin(idToken, accessToken, refreshToken);

      return responseFormatter.success(res, {
        token: result.token,
        user: result.user
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  },
  
  // Verify email
  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        throw new ValidationError('Verification token is required');
      }
      
      const result = await AuthService.verifyEmail(token);
      
      return responseFormatter.success(res, {
        verified: true,
        user: result.user
      }, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Request password reset
  requestPasswordReset: async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ValidationError('Email is required');
      }
      
      await AuthService.requestPasswordReset(email);
      
      // Always return success, even if email not found, for security
      return responseFormatter.success(res, {}, 'If your email is in our system, you will receive a password reset link');
    } catch (error) {
      next(error);
    }
  },
  
  // Reset password
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required');
      }
      
      await AuthService.resetPassword(token, newPassword);
      
      return responseFormatter.success(res, {}, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Change password
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required');
      }
      
      await AuthService.changePassword(userId, currentPassword, newPassword);
      
      return responseFormatter.success(res, {}, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get current user info
  getCurrentUser: async (req, res, next) => {
    try {
      return responseFormatter.success(res, {
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AuthController;