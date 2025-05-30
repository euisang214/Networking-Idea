const { describe, it, before, after, expect, vi, render, screen } = require('./test-helpers');
const path = require('path');

process.env.JWT_SECRET = 'testsecret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY = 'sk_test';
process.env.NODE_ENV = 'test';

vi.mock('../backend/cron', () => ({ initCronJobs: vi.fn(), stopCronJobs: vi.fn() }));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), requestLogger: (req, res, next) => next() }));
vi.mock('../backend/config/swagger', () => ({ swaggerSpec: {}, swaggerUi: { serve: (req, res, next) => next(), setup: () => (req, res, next) => next() } }));
vi.mock('swagger-jsdoc', () => () => ({}));
vi.mock(require.resolve('swagger-jsdoc', { paths: [path.join(__dirname, '../backend')] }), () => () => ({}));
vi.mock('@apidevtools/swagger-parser', () => ({}));
vi.mock('@apidevtools/openapi-schemas', () => ({}));
vi.mock('swagger-ui-express', () => ({ serve: (req, res, next) => next(), setup: () => (req, res, next) => next() }));
vi.mock('ajv', () => {
  return function() {
    return {
      addFormat: vi.fn(),
      compile: () => () => true
    };
  };
});

const mockUser = {
  _id: 'user1',
  email: 'test@test.com',
  isActive: true,
  firstName: 'Test',
  lastName: 'User',
  userType: 'candidate',
  emailVerified: true,
  comparePassword: vi.fn(async (p) => p === 'pass'),
  save: vi.fn(async () => {})
};

vi.mock('../backend/models/user', () => ({
  findOne: vi.fn(() => Promise.resolve(mockUser)),
  findById: vi.fn(() => Promise.resolve(mockUser))
}));

const { app } = require('../backend/app');
const http = require('http');
let server;
let baseUrl;

before(() => {
  server = http.createServer(app).listen(0);
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  server.close();
});

describe('Auth API endpoints', () => {
  it('login returns token and user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'pass' })
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('test@test.com');
  });
});
