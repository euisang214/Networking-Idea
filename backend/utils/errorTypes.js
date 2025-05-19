// Custom error types for consistent error handling

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message || 'Validation error', 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message || 'Authentication error', 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message || 'Not authorized to access this resource', 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || 'Resource conflict', 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message || 'Too many requests, please try again later', 429);
    this.name = 'RateLimitError';
  }
}

class ServerError extends AppError {
  constructor(message) {
    super(message || 'Internal server error', 500);
    this.name = 'ServerError';
  }
}

class ExternalServiceError extends AppError {
  constructor(message, service) {
    super(message || `Error occurred with external service: ${service}`, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  ExternalServiceError
};