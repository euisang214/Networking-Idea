const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authenticate = require('../middlewares/authenticate');
const adminAuth = require('../middlewares/adminAuth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminAuth);

// Dashboard Stats
router.get('/stats', AdminController.getStats);

// Session Management
router.get('/sessions', AdminController.getSessions);
router.post('/sessions/:sessionId/release-payment', AdminController.releasePayment);
router.post('/sessions/:sessionId/verify', AdminController.verifySession);

// Referral Management
router.get('/referrals', AdminController.getReferrals);
router.post('/referrals/:referralId/verify', AdminController.verifyReferral);
router.post('/referrals/:referralId/payout', AdminController.processReferralPayout);

// User Management
router.get('/users', AdminController.getUsers);
router.get('/users/:userId', AdminController.getUserById);
router.put('/users/:userId/status', AdminController.updateUserStatus);
router.delete('/users/:userId', AdminController.deleteUser);

// Professional Management
router.get('/professionals', AdminController.getProfessionals);
router.post('/professionals/:professionalId/verify', AdminController.verifyProfessional);
router.post('/professionals/:professionalId/suspend', AdminController.suspendProfessional);

// Analytics & Reports
router.get('/analytics', AdminController.getAnalytics);
router.get('/reports/revenue', AdminController.getRevenueReport);
router.get('/reports/user-growth', AdminController.getUserGrowthReport);

// System Management
router.get('/system/health', AdminController.getSystemHealth);
router.get('/audit-logs', AdminController.getAuditLogs);

// Settings
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

module.exports = router;