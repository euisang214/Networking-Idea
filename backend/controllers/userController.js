const UserService = require('../services/userService');
const responseFormatter = require('../utils/responseFormatter');

// Controller for user-related operations
const UserController = {
  // Get user profile
  getProfile: async (req, res, next) => {
    try {
      const { user, professionalProfile } = await UserService.getProfile(req.user.id);
      return responseFormatter.success(res, { user, professionalProfile });
    } catch (error) {
      next(error);
    }
  },
  
  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const updated = await UserService.updateProfile(req.user.id, req.body);
      return responseFormatter.success(res, { user: updated }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Delete user account
  deleteAccount: async (req, res, next) => {
    try {
      await UserService.deactivateAccount(req.user.id, req.body.password);
      return responseFormatter.success(res, {}, 'Account deactivated successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get user type
  getUserType: async (req, res, next) => {
    try {
      const userType = await UserService.getUserType(req.user.id);
      return responseFormatter.success(res, { userType });
    } catch (error) {
      next(error);
    }
  },
  
  // Set user type
  setUserType: async (req, res, next) => {
    try {
      const newType = await UserService.setUserType(req.user.id, req.body.userType);
      return responseFormatter.success(res, { userType: newType }, 'User type updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get Google Calendar availability for current user
  getCalendarAvailability: async (req, res, next) => {
    try {
      const busy = await UserService.getCalendarAvailability(req.user.id);
      return responseFormatter.success(res, { busy });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = UserController;