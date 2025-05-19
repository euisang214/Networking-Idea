import { describe, it, expect, beforeAll } from 'vitest';
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
