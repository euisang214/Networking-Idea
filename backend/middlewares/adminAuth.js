const { AuthorizationError } = require('../utils/errorTypes');

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.userType !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }
  next();
};

module.exports = adminAuth;