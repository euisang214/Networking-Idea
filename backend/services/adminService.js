const User = require('../models/user');
const Session = require('../models/session');
const Referral = require('../models/referral');
const ProfessionalProfile = require('../models/professionalProfile');
const Payment = require('../models/payment');
const PaymentService = require('./paymentService');
const ReferralService = require('./referralService');

const AdminService = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    const [totalSessions, pendingPayments, activeReferrals, totalRevenue] = await Promise.all([
      Session.countDocuments(),
      Session.countDocuments({ paymentStatus: 'paid', status: 'completed' }),
      Referral.countDocuments({ status: 'pending', emailDomainVerified: true }),
      Payment.aggregate([
        { $match: { status: 'completed', type: 'session' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return {
      totalSessions,
      pendingPayments,
      activeReferrals,
      totalRevenue: totalRevenue[0]?.total || 0
    };
  },

  // Session Management
  getSessions: async (filters = {}, page = 1, limit = 50) => {
    const query = {};
    if (filters.status) query.status = filters.status;

    const sessions = await Session.find(query)
      .populate('professional', 'user title company')
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'professional',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return sessions;
  },

  releaseSessionPayment: async (sessionId) => {
    return await PaymentService.releaseSessionPayment(sessionId);
  },

// Add these methods to the existing AdminService object:

  verifySession: async (sessionId) => {
    const session = await Session.findById(sessionId);
    if (!session) throw new Error('Session not found');
    
    session.zoomMeetingVerified = true;
    session.status = 'completed';
    await session.save();
    
    return { sessionId, verified: true };
  },

  // Referral Management
  getReferrals: async (filters = {}, page = 1, limit = 50) => {
    const query = {};
    if (filters.status) query.status = filters.status;

    const referrals = await Referral.find(query)
      .populate('professional', 'user title company')
      .populate('candidate', 'firstName lastName email')
      .populate({
        path: 'professional',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return referrals;
  },

  verifyReferral: async (referralId) => {
    return await ReferralService.verifyReferral(referralId);
  },

  processReferralPayout: async (referralId) => {
    return await PaymentService.processReferralPayment(referralId);
  },

  // User Management
  getUsers: async (filters = {}, page = 1, limit = 50) => {
    const query = {};
    if (filters.userType) query.userType = filters.userType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return { users, total, page: parseInt(page), limit: parseInt(limit) };
  },

  getUserById: async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  },

  updateUserStatus: async (userId, status) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.isActive = status === 'active';
    await user.save();
    
    return { userId, status: user.isActive ? 'active' : 'inactive' };
  },

  deleteUser: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Soft delete - deactivate instead of hard delete
    user.isActive = false;
    await user.save();
    
    return { userId, deleted: true };
  },

  // Professional Management
  getProfessionals: async (filters = {}, page = 1, limit = 50) => {
    const query = {};
    if (filters.isVerified !== undefined) query.isVerified = filters.isVerified === 'true';
    if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';

    const professionals = await ProfessionalProfile.find(query)
      .populate('user', 'firstName lastName email')
      .populate('industry', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProfessionalProfile.countDocuments(query);

    return { professionals, total, page: parseInt(page), limit: parseInt(limit) };
  },

  verifyProfessional: async (professionalId) => {
    const professional = await ProfessionalProfile.findById(professionalId);
    if (!professional) throw new Error('Professional not found');
    
    professional.isVerified = true;
    professional.verificationDate = new Date();
    await professional.save();
    
    return { professionalId, verified: true };
  },

  suspendProfessional: async (professionalId, reason) => {
    const professional = await ProfessionalProfile.findById(professionalId);
    if (!professional) throw new Error('Professional not found');
    
    professional.isActive = false;
    professional.suspensionReason = reason;
    professional.suspendedAt = new Date();
    await professional.save();
    
    return { professionalId, suspended: true, reason };
  },

  // Analytics
  getAnalytics: async (range = '30d') => {
    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      sessionsOverTime,
      revenueOverTime,
      userGrowth,
      topProfessionals
    ] = await Promise.all([
      Session.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      ProfessionalProfile.aggregate([
        {
          $lookup: {
            from: 'sessions',
            localField: '_id',
            foreignField: 'professional',
            as: 'sessions'
          }
        },
        {
          $project: {
            user: 1,
            totalSessions: { $size: '$sessions' },
            totalEarnings: '$statistics.totalEarnings'
          }
        },
        { $sort: { totalEarnings: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        }
      ])
    ]);

    return {
      sessionsOverTime,
      revenueOverTime,
      userGrowth,
      topProfessionals
    };
  },

  getRevenueReport: async (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const revenue = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    return revenue[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 };
  },

  getUserGrowthReport: async (range = '90d') => {
    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            userType: '$userType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return growth;
  },

  // System Health
  getSystemHealth: async () => {
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      completedSessions,
      systemErrors
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      // You can add error tracking here
      Promise.resolve(0)
    ]);

    return {
      database: 'healthy',
      totalUsers,
      activeUsers,
      totalSessions,
      completedSessions,
      systemErrors,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  },

  // Audit Logs
  getAuditLogs: async (filters = {}, page = 1, limit = 50) => {
    const AuditLog = require('../models/auditLog');
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;

    const logs = await AuditLog.find(query)
      .populate('admin', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    return { logs, total, page: parseInt(page), limit: parseInt(limit) };
  },

  // Settings Management
  getSettings: async () => {
    // This would typically come from a settings collection or config
    return {
      platformFeePercent: process.env.PLATFORM_FEE_PERCENT || 15,
      referralRewardAmount: process.env.REFERRAL_REWARD_AMOUNT || 50,
      maxRewardPerPro: process.env.MAX_REWARD_PER_PRO || 5,
      cooldownDays: process.env.COOLDOWN_DAYS || 7,
      minPayoutAmount: process.env.MIN_PAYOUT_AMOUNT || 1
    };
  },

  updateSettings: async (settings) => {
    // In a real implementation, you'd save these to a database
    // For now, we'll just return the settings as confirmation
    return settings;
  }
};

module.exports = AdminService;