const User = require('../models/user');
const ProfessionalService = require('../services/professionalService');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthorizationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// Controller for user-related operations
const UserController = {
  // Get user profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get user
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Check if user has a professional profile
      let professionalProfile = null;
      if (user.userType === 'professional') {
        try {
          professionalProfile = await ProfessionalService.getProfileByUserId(userId, true);
        } catch (error) {
          // Professional profile not found, that's fine
        }
      }
      
      return responseFormatter.success(res, {
        user,
        professionalProfile
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phoneNumber, profileImage, resume, settings } = req.body;
      
      // Get user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Update fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (profileImage) user.profileImage = profileImage;
      if (resume) user.resume = resume;
      
      // Update settings
      if (settings) {
        if (settings.notifications) {
          user.settings.notifications = {
            ...user.settings.notifications,
            ...settings.notifications
          };
        }
        
        if (settings.timezone) user.settings.timezone = settings.timezone;
        if (settings.language) user.settings.language = settings.language;
      }
      
      await user.save();
      
      return responseFormatter.success(res, {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          profileImage: user.profileImage,
          phoneNumber: user.phoneNumber,
          resume: user.resume,
          settings: user.settings
        }
      }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Delete user account
  deleteAccount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;
      
      // Get user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Verify password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        throw new ValidationError('Invalid password');
      }
      
      // Deactivate account instead of deleting
      user.isActive = false;
      await user.save();
      
      return responseFormatter.success(res, {}, 'Account deactivated successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get user type
  getUserType: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get user
      const user = await User.findById(userId).select('userType');
      
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      return responseFormatter.success(res, {
        userType: user.userType
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Set user type
  setUserType: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { userType } = req.body;
      
      // Validate user type
      if (!userType || !['candidate', 'professional'].includes(userType)) {
        throw new ValidationError('Invalid user type');
      }
      
      // Get user
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      // Update user type
      user.userType = userType;
      await user.save();
      
      return responseFormatter.success(res, {
        userType: user.userType
      }, 'User type updated successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = UserController;