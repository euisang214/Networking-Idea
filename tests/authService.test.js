const { describe, it, expect, beforeAll, vi } = require('./test-helpers');

vi.mock('../backend/services/emailService', () => ({ sendEmail: vi.fn() }));
vi.mock('../backend/services/googleService', () => ({
  verifyIdToken: vi.fn(),
  getAvailability: vi.fn()
}));
vi.mock('../backend/models/user', () => ({}));
vi.mock('bcryptjs', () => ({ genSalt: vi.fn(), hash: vi.fn(), compare: vi.fn() }));
vi.mock('../backend/utils/logger', () => ({ debug: vi.fn(), error: vi.fn() }));
vi.mock('jsonwebtoken', () => ({
  sign: (payload, secret) => Buffer.from(JSON.stringify(payload)).toString('base64') + '.' + secret,
  verify: (token, secret) => {
    const [data, sec] = token.split('.');
    if (sec !== secret) throw new Error('invalid');
    return JSON.parse(Buffer.from(data, 'base64').toString());
  }
}));

const AuthService = require('../backend/services/authService');

describe('AuthService token methods', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
  });

  it('generateToken and verifyToken round trip', () => {
    const token = AuthService.generateToken({ _id:'1', email:'a@test.com', userType:'admin' });
    const decoded = AuthService.verifyToken(token);
    expect(decoded.email).toBe('a@test.com');
    expect(decoded.userType).toBe('admin');
  });

  it('verifyToken returns null on invalid token', () => {
    const token = AuthService.generateToken({ _id:'1', email:'a@test.com', userType:'admin' });
    expect(AuthService.verifyToken(token + 'bad')).toBeNull();
  });
});
