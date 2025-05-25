import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const AuthAPI = {
  /**
   * Create a new user account
   * @param {Object} userData - Registration details
   * @returns {Promise<Object>} Created user data
   */
  createUser: async (userData) =>
    handleRequest(api.post('/auth/register', userData)),
  
  /**
   * Authenticate user credentials
   * @param {Object} credentials - Login email and password
   * @returns {Promise<Object>} Auth session information
   */
  createSession: async (credentials) => {
    const data = await handleRequest(api.post('/auth/login', credentials));
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  
  /**
   * Remove stored auth session
   */
  deleteSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  /**
   * Fetch the current authenticated user
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: () => handleRequest(api.get('/auth/me')),
  
  /**
   * Verify user email address
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Verification result
   */
  updateEmailVerification: (token) =>
    handleRequest(api.get(`/auth/verify-email?token=${token}`)),
  
  /**
   * Request a password reset email
   * @param {string} email - User email address
   * @returns {Promise<Object>} Request status
   */
  createPasswordResetRequest: (email) =>
    handleRequest(api.post('/auth/forgot-password', { email })),
  
  /**
   * Reset password using a reset token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Operation result
   */
  updatePasswordWithToken: (token, newPassword) =>
    handleRequest(
      api.post('/auth/reset-password', { token, newPassword })
    ),
  
  /**
   * Change password for the current user
   * @param {string} currentPassword - Existing password
   * @param {string} newPassword - Desired new password
   * @returns {Promise<Object>} Operation result
   */
  updatePassword: (currentPassword, newPassword) =>
    handleRequest(
      api.post('/auth/change-password', { currentPassword, newPassword })
    )
};

export default AuthAPI;