const AdminService = require('../services/adminService');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const AdminController = {
  // Dashboard Stats
  getStats: async (req, res, next) => {
    try {
      const stats = await AdminService.getDashboardStats();
      return responseFormatter.success(res, stats);
    } catch (error) {
      next(error);
    }
  },

  // Session Management
  getSessions: async (req, res, next) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const sessions = await AdminService.getSessions({ status }, page, limit);
      return responseFormatter.success(res, { sessions });
    } catch (error) {
      next(error);
    }
  },

  releasePayment: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const result = await AdminService.releaseSessionPayment(sessionId);
      return responseFormatter.success(res, result, 'Payment released successfully');
    } catch (error) {
      next(error);
    }
  },

  // Referral Management
  getReferrals: async (req, res, next) => {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const referrals = await AdminService.getReferrals({ status }, page, limit);
      return responseFormatter.success(res, { referrals });
    } catch (error) {
      next(error);
    }
  },

  verifyReferral: async (req, res, next) => {
    try {
      const { referralId } = req.params;
      const result = await AdminService.verifyReferral(referralId);
      return responseFormatter.success(res, result, 'Referral verified successfully');
    } catch (error) {
      next(error);
    }
  },

  // User Management
  getUsers: async (req, res, next) => {
    try {
      const { userType, isActive, page = 1, limit = 50 } = req.query;
      const filters = { userType, isActive };
      const users = await AdminService.getUsers(filters, page, limit);
      return responseFormatter.success(res, users);
    } catch (error) {
      next(error);
    }
  },

// Add these methods to the existing AdminController object:

  verifySession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const result = await AdminService.verifySession(sessionId);
      return responseFormatter.success(res, result, 'Session verified successfully');
    } catch (error) {
      next(error);
    }
  },

  processReferralPayout: async (req, res, next) => {
    try {
      const { referralId } = req.params;
      const result = await AdminService.processReferralPayout(referralId);
      return responseFormatter.success(res, result, 'Referral payout processed successfully');
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const user = await AdminService.getUserById(userId);
      return responseFormatter.success(res, { user });
    } catch (error) {
      next(error);
    }
  },

  updateUserStatus: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      const result = await AdminService.updateUserStatus(userId, status);
      return responseFormatter.success(res, result, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const result = await AdminService.deleteUser(userId);
      return responseFormatter.success(res, result, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  getProfessionals: async (req, res, next) => {
    try {
      const { isVerified, isActive, page = 1, limit = 50 } = req.query;
      const filters = { isVerified, isActive };
      const professionals = await AdminService.getProfessionals(filters, page, limit);
      return responseFormatter.success(res, professionals);
    } catch (error) {
      next(error);
    }
  },

  verifyProfessional: async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const result = await AdminService.verifyProfessional(professionalId);
      return responseFormatter.success(res, result, 'Professional verified successfully');
    } catch (error) {
      next(error);
    }
  },

  suspendProfessional: async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const { reason } = req.body;
      const result = await AdminService.suspendProfessional(professionalId, reason);
      return responseFormatter.success(res, result, 'Professional suspended successfully');
    } catch (error) {
      next(error);
    }
  },

  getAnalytics: async (req, res, next) => {
    try {
      const { range = '30d' } = req.query;
      const analytics = await AdminService.getAnalytics(range);
      return responseFormatter.success(res, analytics);
    } catch (error) {
      next(error);
    }
  },

  getRevenueReport: async (req, res, next) => {
    try {
      const { start, end } = req.query;
      const report = await AdminService.getRevenueReport(start, end);
      return responseFormatter.success(res, report);
    } catch (error) {
      next(error);
    }
  },

  getUserGrowthReport: async (req, res, next) => {
    try {
      const { range = '90d' } = req.query;
      const report = await AdminService.getUserGrowthReport(range);
      return responseFormatter.success(res, report);
    } catch (error) {
      next(error);
    }
  },

  getSystemHealth: async (req, res, next) => {
    try {
      const health = await AdminService.getSystemHealth();
      return responseFormatter.success(res, health);
    } catch (error) {
      next(error);
    }
  },

  getAuditLogs: async (req, res, next) => {
    try {
      const { action, resource, page = 1, limit = 50 } = req.query;
      const filters = { action, resource };
      const logs = await AdminService.getAuditLogs(filters, page, limit);
      return responseFormatter.success(res, logs);
    } catch (error) {
      next(error);
    }
  },

  getSettings: async (req, res, next) => {
    try {
      const settings = await AdminService.getSettings();
      return responseFormatter.success(res, settings);
    } catch (error) {
      next(error);
    }
  },

  updateSettings: async (req, res, next) => {
    try {
      const settings = req.body;
      const result = await AdminService.updateSettings(settings);
      return responseFormatter.success(res, result, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = AdminController;