const { AuthorizationError } = require('../utils/errorTypes');

function rolesAllowed(roles = []) {
  return (req, res, next) => {
    const userRole = req.user && req.user.userType;
    if (!userRole || !roles.includes(userRole)) {
      return next(new AuthorizationError('Not authorized'));
    }
    next();
  };
}

module.exports = rolesAllowed;
