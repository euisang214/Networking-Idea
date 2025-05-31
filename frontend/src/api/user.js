import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const UserAPI = {
  /**
   * Get user profile
   * @returns {Promise<Object>} User profile data
   */
  getProfile: () => handleRequest(api.get('/users/profile')),

  /**
   * Update user profile
   * @param {Object} profileData - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: (profileData) =>
    handleRequest(api.put('/users/profile', profileData)),

  /**
   * Delete user account
   * @param {string} password - User password for confirmation
   * @returns {Promise<Object>} Deletion result
   */
  deleteAccount: (password) =>
    handleRequest(api.delete('/users/account', { data: { password } })),

  /**
   * Get user type
   * @returns {Promise<string>} User type
   */
  getUserType: () => handleRequest(api.get('/users/type')),

  /**
   * Set user type
   * @param {string} userType - New user type
   * @returns {Promise<string>} Updated user type
   */
  setUserType: (userType) =>
    handleRequest(api.put('/users/type', { userType })),

  /**
   * Get calendar availability
   * @returns {Promise<Array>} Busy times
   */
  getCalendarAvailability: () =>
    handleRequest(api.get('/users/calendar-availability'))
};

export default UserAPI;