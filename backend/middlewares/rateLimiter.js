const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errorTypes');

/**
 * Create rate limiter middleware
 * @param {number} max - Maximum number of requests
 * @param {number} windowMin - Time window in minutes
 * @param {string} message - Error message
 */
const createRateLimiter = (max = 100, windowMin = 15, message = 'Too many requests, please try again later') => {
  return rateLimit({
    windowMs: windowMin * 60 * 1000, // convert to milliseconds
    max,
    handler: (req, res, next) => {
      next(new RateLimitError(message));
    },
    standardHeaders: true, // Return rate limit info in the headers
    legacyHeaders: false // Disable X-RateLimit headers
  });
};

// Different rate limiters for different routes

const parseEnvInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  parseEnvInt(process.env.API_RATE_LIMIT_MAX, 100),
  parseEnvInt(process.env.API_RATE_LIMIT_WINDOW_MIN, 15)
);

// Auth endpoints rate limiter (more strict)
const authLimiter = createRateLimiter(
  parseEnvInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  parseEnvInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 15),
  'Too many login attempts, please try again later'
);

// Webhook rate limiter (more permissive)
const webhookLimiter = createRateLimiter(
  parseEnvInt(process.env.WEBHOOK_RATE_LIMIT_MAX, 300),
  parseEnvInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MIN, 15)
);

module.exports = {
  apiLimiter,
  authLimiter,
  webhookLimiter
};