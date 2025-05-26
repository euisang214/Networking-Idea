const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errorTypes');
const config = require('../config');

/**
 * Create rate limiter middleware
 * @param {number} max - Maximum number of requests
 * @param {number} windowMin - Time window in minutes
 * @param {string} message - Error message
 */
const createRateLimiter = (max = 100, windowMin = 15, message = 'Too many requests, please try again later') => {
  const options = {
    windowMs: windowMin * 60 * 1000,
    max,
    handler: (req, res, next) => {
      next(new RateLimitError(message));
    },
    standardHeaders: true,
    legacyHeaders: false
  };
  const middleware = rateLimit(options);
  // expose config for testing/introspection
  middleware.max = options.max;
  middleware.windowMs = options.windowMs;
  return middleware;
};

// Different rate limiters for different routes

const parseEnvInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  parseEnvInt(config.rateLimit.api.max, 100),
  parseEnvInt(config.rateLimit.api.windowMin, 15)
);

// Auth endpoints rate limiter (more strict)
const authLimiter = createRateLimiter(
  parseEnvInt(config.rateLimit.auth.max, 20),
  parseEnvInt(config.rateLimit.auth.windowMin, 15),
  'Too many login attempts, please try again later'
);

// Webhook rate limiter (more permissive)
const webhookLimiter = createRateLimiter(
  parseEnvInt(config.rateLimit.webhook.max, 300),
  parseEnvInt(config.rateLimit.webhook.windowMin, 15)
);

module.exports = {
  apiLimiter,
  authLimiter,
  webhookLimiter
};