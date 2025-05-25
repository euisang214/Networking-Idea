const responseFormatter = require('../utils/responseFormatter');
const { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError 
} = require('../utils/errorTypes');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name || 'Error'}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Handle different error types
  if (err instanceof ValidationError) {
    return responseFormatter.validationError(res, err.errors);
  }
  
  if (err instanceof AuthenticationError) {
    return responseFormatter.authError(res, err.message);
  }
  
  if (err instanceof AuthorizationError) {
    return responseFormatter.forbidden(res, err.message);
  }
  
  if (err instanceof NotFoundError) {
    return responseFormatter.notFound(res, err.message);
  }
  
  if (err instanceof ConflictError) {
    return responseFormatter.conflict(res, err.message);
  }
  
  if (err instanceof AppError) {
    return responseFormatter.error(res, err.message, err.statusCode);
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = {};
    
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
    
    return responseFormatter.validationError(res, errors);
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    return responseFormatter.conflict(res, 'Duplicate entry');
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return responseFormatter.authError(res, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return responseFormatter.authError(res, 'Token expired');
  }
  
  // Default to 500 server error
  return responseFormatter.serverError(res, config.app.env === 'production' ? 'Internal server error' : err.message);
};

module.exports = errorHandler;