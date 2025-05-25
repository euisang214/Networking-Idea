// frontend/src/api/admin.js
import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const AdminAPI = {
  /**
   * Fetch overall dashboard statistics
   * @returns {Promise<Object>} Stats data
   */
  getStats: () => handleRequest(api.get('/admin/stats')),

  /**
   * Retrieve sessions with optional status filter
   */
  getSessions: (status = null, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    return handleRequest(api.get(`/admin/sessions?${params}`));
  },

  /**
   * Release payment for a session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Operation result
   */
  createPaymentRelease: (sessionId) =>
    handleRequest(api.post(`/admin/sessions/${sessionId}/release-payment`)),

  /**
   * Verify a session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Operation result
   */
  updateSessionVerification: (sessionId) =>
    handleRequest(api.post(`/admin/sessions/${sessionId}/verify`)),

  /**
   * Referral Management
   */
  getReferrals: (status = null, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    return handleRequest(api.get(`/admin/referrals?${params}`));
  },

  /**
   * Verify a referral
   * @param {string} referralId - Referral identifier
   * @returns {Promise<Object>} Operation result
   */
  updateReferralVerification: (referralId) =>
    handleRequest(api.post(`/admin/referrals/${referralId}/verify`)),

  /**
   * Process referral payout
   * @param {string} referralId - Referral identifier
   * @returns {Promise<Object>} Operation result
   */
  createReferralPayout: (referralId) =>
    handleRequest(api.post(`/admin/referrals/${referralId}/payout`)),

  /**
   * User Management
   */
  getUsers: (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return handleRequest(api.get(`/admin/users?${params}`));
  },

  /**
   * Fetch a user by id
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} User data
   */
  getUserById: (userId) => handleRequest(api.get(`/admin/users/${userId}`)),

  /**
   * Update user status
   * @param {string} userId - User identifier
   * @param {string} status - New status
   * @returns {Promise<Object>} Operation result
   */
  updateUserStatus: (userId, status) =>
    handleRequest(api.put(`/admin/users/${userId}/status`, { status })),

  /**
   * Delete a user
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Operation result
   */
  deleteUser: (userId) =>
    handleRequest(api.delete(`/admin/users/${userId}`)),

  /**
   * Professional Management
   */
  getProfessionals: (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return handleRequest(api.get(`/admin/professionals?${params}`));
  },

  /**
   * Verify a professional profile
   * @param {string} professionalId - Professional identifier
   * @returns {Promise<Object>} Operation result
   */
  updateProfessionalVerification: (professionalId) =>
    handleRequest(
      api.post(`/admin/professionals/${professionalId}/verify`)
    ),

  /**
   * Suspend a professional
   * @param {string} professionalId - Professional identifier
   * @param {string} reason - Suspension reason
   * @returns {Promise<Object>} Operation result
   */
  updateProfessionalSuspension: (professionalId, reason) =>
    handleRequest(
      api.post(`/admin/professionals/${professionalId}/suspend`, { reason })
    ),

  /**
   * Analytics & Reports
   */
  getAnalytics: (timeRange = '30d') =>
    handleRequest(api.get(`/admin/analytics?range=${timeRange}`)),

  getRevenueReport: (startDate, endDate) =>
    handleRequest(api.get(`/admin/reports/revenue?start=${startDate}&end=${endDate}`)),

  getUserGrowthReport: (timeRange = '90d') =>
    handleRequest(api.get(`/admin/reports/user-growth?range=${timeRange}`)),

  /**
   * System Management
   */
  getSystemHealth: () => handleRequest(api.get('/admin/system/health')),

  getAuditLogs: (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return handleRequest(api.get(`/admin/audit-logs?${params}`));
  },

  /**
   * Settings Management
   */
  getSettings: () => handleRequest(api.get('/admin/settings')),

  updateSettings: (settings) =>
    handleRequest(api.put('/admin/settings', settings)),

  /**
   * Data Export
   */
  exportData: (type, filters = {}) => {
    const params = new URLSearchParams(filters);
    return handleRequest(
      api.get(`/admin/export/${type}?${params}`, {
        responseType: 'blob'
      })
    );
  },

  /**
   * Notifications
   */
  createBulkNotification: (notification) =>
    handleRequest(
      api.post('/admin/notifications/send-bulk', notification)
    ),

  /**
   * Content Moderation
   */
  getReportedContent: (page = 1, limit = 50) =>
    handleRequest(
      api.get(`/admin/content/reported?page=${page}&limit=${limit}`)
    ),

  updateContentModeration: (contentId, action, reason) =>
    handleRequest(
      api.post(`/admin/content/${contentId}/moderate`, { action, reason })
    )
};

export default AdminAPI;