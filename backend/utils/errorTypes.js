/**
 * Custom error types for consistent error handling
 */

/**
 * Base API Error
 */
class APIError extends Error {
  constructor(message, details) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - The request could not be understood or was missing required parameters
 */
class BadRequestError extends APIError {
  constructor(message = 'Bad Request', details) {
    super(message, details);
  }
}

/**
 * 401 Unauthorized - Authentication failed or user does not have permissions
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized', details) {
    super(message, details);
  }
}

/**
 * 403 Forbidden - User is authenticated but does not have permission
 */
class ForbiddenError extends APIError {
  constructor(message = 'Forbidden', details) {
    super(message, details);
  }
}

/**
 * 404 Not Found - Resource not found
 */
class NotFoundError extends APIError {
  constructor(message = 'Not Found', details) {
    super(message, details);
  }
}

/**
 * 409 Conflict - Request could not be completed due to a conflict
 */
class ConflictError extends APIError {
  constructor(message = 'Conflict', details) {
    super(message, details);
  }
}

/**
 * 422 Unprocessable Entity - Validation error
 */
class ValidationError extends APIError {
  constructor(message = 'Validation Error', details) {
    super(message, details);
  }
}

/**
 * 500 Internal Server Error - Server error
 */
class InternalServerError extends APIError {
  constructor(message = 'Internal Server Error', details) {
    super(message, details);
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
class ServiceUnavailableError extends APIError {
  constructor(message = 'Service Unavailable', details) {
    super(message, details);
  }
}

module.exports = {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError
};
