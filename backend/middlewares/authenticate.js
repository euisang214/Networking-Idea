/**
 * Authentication middleware
 */
const passport = require('passport');
const { UnauthorizedError } = require('../utils/errorTypes');

/**
 * Middleware to authenticate requests using JWT strategy
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return next(new UnauthorizedError(info ? info.message : 'Unauthorized'));
    }
    
    // Attach user to request
    req.user = user;
    
    next();
  })(req, res, next);
};

/**
 * Middleware to restrict access based on user role
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Unauthorized - user not authenticated'));
    }
    
    // Check if the user's role is in the allowed roles
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Forbidden - insufficient permissions'));
    }
    
    next();
  };
};

module.exports = authenticate;
module.exports.authorize = authorize;
