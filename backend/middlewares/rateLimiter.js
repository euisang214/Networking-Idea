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

// General API rate limiter
const apiLimiter = createRateLimiter(100, 15);

// Auth endpoints rate limiter (more strict)
const authLimiter = createRateLimiter(20, 15, 'Too many login attempts, please try again later');

// Webhook rate limiter (more permissive)
const webhookLimiter = createRateLimiter(300, 15);

module.exports = {
  apiLimiter,
  authLimiter,
  webhookLimiter
};