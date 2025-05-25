const { AuthorizationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }
  
  // Log admin actions for audit trail
  logger.info('Admin action', {
    adminId: req.user.id,
    action: req.method,
    resource: req.originalUrl,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

module.exports = adminAuth;
