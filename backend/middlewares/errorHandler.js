/**
 * Global error handler middleware
 */
const logger = require('../utils/logger');
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError
} = require('../utils/errorTypes');

/**
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Set default status code and error details
  let statusCode = 500;
  let errorResponse = {
    status: 'error',
    message: 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  // Handle specific error types
  if (err instanceof BadRequestError) {
    statusCode = 400;
    errorResponse.message = err.message;
    if (err.details) {
      errorResponse.details = err.details;
    }
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    errorResponse.message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    errorResponse.message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorResponse.message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    errorResponse.message = err.message;
  } else if (err instanceof ValidationError) {
    statusCode = 422;
    errorResponse.message = err.message;
    if (err.details) {
      errorResponse.details = err.details;
    }
  } else if (err instanceof InternalServerError) {
    statusCode = 500;
    errorResponse.message = err.message;
  }

  // Handle validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    errorResponse.message = 'Validation error';
    errorResponse.details = err.array();
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse.message = 'Token expired';
  }

  // Log error
  const logMethod = statusCode >= 500 ? 'error' : 'warn';
  logger[logMethod](`[${statusCode}] ${errorResponse.message}`, {
    path: req.path,
    method: req.method,
    requestId: req.id,
    error: err
  });

  // Send response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
