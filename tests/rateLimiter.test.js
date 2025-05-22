const { describe, it, expect, vi } = require('./test-helpers');

vi.mock('express-rate-limit', () => (opts) => opts);

process.env.API_RATE_LIMIT_MAX = '5';
process.env.API_RATE_LIMIT_WINDOW_MIN = '10';
process.env.AUTH_RATE_LIMIT_MAX = '3';
process.env.AUTH_RATE_LIMIT_WINDOW_MIN = '2';
process.env.WEBHOOK_RATE_LIMIT_MAX = '9';
process.env.WEBHOOK_RATE_LIMIT_WINDOW_MIN = '1';

const { apiLimiter, authLimiter, webhookLimiter } = require('../backend/middlewares/rateLimiter');

describe('rateLimiter middleware', () => {
  it('uses environment variables for limits', () => {
    expect(apiLimiter.max).toBe(5);
    expect(apiLimiter.windowMs).toBe(10 * 60 * 1000);
    expect(authLimiter.max).toBe(3);
    expect(authLimiter.windowMs).toBe(2 * 60 * 1000);
    expect(webhookLimiter.max).toBe(9);
    expect(webhookLimiter.windowMs).toBe(1 * 60 * 1000);
  });
});
