const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errorTypes');

/**
 * Middleware to handle validation errors
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorObj = {};
    
    errors.array().forEach(error => {
      errorObj[error.param] = error.msg;
    });
    
    throw new ValidationError('Validation failed', errorObj);
  }
  
  next();
};

module.exports = validationMiddleware;