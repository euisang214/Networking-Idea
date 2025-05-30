const User = require('../models/user');
const ProfessionalService = require('./professionalService');
const GoogleService = require('./googleService');
const { ValidationError, AuthorizationError } = require('../utils/errorTypes');

class UserService {
  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new ValidationError('User not found');
    }
    return user;
  }

  async getProfile(userId) {
    const user = await this.getUserById(userId);
    const safeUser = await User.findById(userId).select('-password');
    let professionalProfile = null;
    if (user.userType === 'professional') {
      try {
        professionalProfile = await ProfessionalService.getProfileByUserId(userId, true);
      } catch (err) {
        /* ignore missing profile */
      }
    }
    return { user: safeUser, professionalProfile };
  }

  async updateProfile(userId, updates) {
    const user = await this.getUserById(userId);
    const fields = ['firstName', 'lastName', 'phoneNumber', 'profileImage', 'resume', 'offerBonusAmount'];
    fields.forEach(f => {
      if (updates[f] !== undefined) user[f] = updates[f];
    });
    if (updates.settings) {
      if (updates.settings.notifications) {
        user.settings.notifications = {
          ...user.settings.notifications,
          ...updates.settings.notifications,
        };
      }
      if (updates.settings.timezone) user.settings.timezone = updates.settings.timezone;
      if (updates.settings.language) user.settings.language = updates.settings.language;
    }
    await user.save();
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      profileImage: user.profileImage,
      phoneNumber: user.phoneNumber,
      resume: user.resume,
      settings: user.settings,
    };
  }

  async deactivateAccount(userId, password) {
    const user = await this.getUserById(userId);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ValidationError('Invalid password');
    }
    user.isActive = false;
    await user.save();
  }

  async ensureAdmin(userId) {
    const user = await this.getUserById(userId);
    if (user.userType !== 'admin') {
      throw new AuthorizationError('Only admins can perform this action');
    }
    return user;
  }

  async getUserType(userId) {
    const user = await this.getUserById(userId);
    return user.userType;
  }

  async setUserType(userId, userType) {
    if (!['candidate', 'professional'].includes(userType)) {
      throw new ValidationError('Invalid user type');
    }
    const user = await this.getUserById(userId);
    user.userType = userType;
    await user.save();
    return user.userType;
  }

  async getCalendarAvailability(userId) {
    const user = await this.getUserById(userId);
    if (!user.googleAccessToken) {
      throw new ValidationError('Google account not connected');
    }
    const now = new Date();
    const week = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return GoogleService.getAvailability(
      user.googleAccessToken,
      now.toISOString(),
      week.toISOString(),
    );
  }
}

module.exports = new UserService();
