// frontend/src/api/admin.js
import api from '../services/api/client';

const AdminAPI = {
  // Dashboard Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data.data;
  },

  // Session Management
  getSessions: async (status = null, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    const response = await api.get(`/admin/sessions?${params}`);
    return response.data.data.sessions;
  },

  releasePayment: async (sessionId) => {
    const response = await api.post(`/admin/sessions/${sessionId}/release-payment`);
    return response.data.data;
  },

  verifySession: async (sessionId) => {
    const response = await api.post(`/admin/sessions/${sessionId}/verify`);
    return response.data.data;
  },

  // Referral Management
  getReferrals: async (status = null, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    
    const response = await api.get(`/admin/referrals?${params}`);
    return response.data.data.referrals;
  },

  verifyReferral: async (referralId) => {
    const response = await api.post(`/admin/referrals/${referralId}/verify`);
    return response.data.data;
  },

  processReferralPayout: async (referralId) => {
    const response = await api.post(`/admin/referrals/${referralId}/payout`);
    return response.data.data;
  },

  // User Management
  getUsers: async (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/admin/users?${params}`);
    return response.data.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data.data.user;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data.data;
  },

  // Professional Management
  getProfessionals: async (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/admin/professionals?${params}`);
    return response.data.data;
  },

  verifyProfessional: async (professionalId) => {
    const response = await api.post(`/admin/professionals/${professionalId}/verify`);
    return response.data.data;
  },

  suspendProfessional: async (professionalId, reason) => {
    const response = await api.post(`/admin/professionals/${professionalId}/suspend`, { reason });
    return response.data.data;
  },

  // Analytics & Reports
  getAnalytics: async (timeRange = '30d') => {
    const response = await api.get(`/admin/analytics?range=${timeRange}`);
    return response.data.data;
  },

  getRevenueReport: async (startDate, endDate) => {
    const response = await api.get(`/admin/reports/revenue?start=${startDate}&end=${endDate}`);
    return response.data.data;
  },

  getUserGrowthReport: async (timeRange = '90d') => {
    const response = await api.get(`/admin/reports/user-growth?range=${timeRange}`);
    return response.data.data;
  },

  // System Management
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data.data;
  },

  getAuditLogs: async (filters = {}, page = 1, limit = 50) => {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await api.get(`/admin/audit-logs?${params}`);
    return response.data.data;
  },

  // Settings Management
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data.data;
  },

  // Data Export
  exportData: async (type, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/admin/export/${type}?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Notifications
  sendBulkNotification: async (notification) => {
    const response = await api.post('/admin/notifications/send-bulk', notification);
    return response.data.data;
  },

  // Content Moderation
  getReportedContent: async (page = 1, limit = 50) => {
    const response = await api.get(`/admin/content/reported?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  moderateContent: async (contentId, action, reason) => {
    const response = await api.post(`/admin/content/${contentId}/moderate`, { action, reason });
    return response.data.data;
  }
};

export default AdminAPI;