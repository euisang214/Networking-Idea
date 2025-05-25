const { describe, it, expect, vi } = require('./test-helpers');

const saved = [];
class User {
  constructor(data) { Object.assign(this, data); }
  save = vi.fn(async () => { saved.push(this); return this; });
  static async findOne(query) {
    return saved.find(u => (query.googleId && u.googleId === query.googleId) ||
      (query.email && u.email === query.email));
  }
}
vi.mock('../backend/models/user', () => User);
vi.mock('../backend/services/googleService', () => ({
  verifyIdToken: vi.fn(() => Promise.resolve({
    sub: 'gid', email: 'g@test.com', given_name: 'G', family_name: 'U'
  }))
}));
vi.mock('../backend/services/emailService', () => ({ sendEmail: vi.fn() }));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn(), debug: vi.fn() }));
vi.mock('bcryptjs', () => ({ genSalt: vi.fn(), hash: vi.fn(), compare: vi.fn() }));
vi.mock('crypto', () => ({ randomBytes: () => Buffer.from('rand') }));
vi.mock('jsonwebtoken', () => ({ sign: () => 'token' }));

process.env.JWT_SECRET = 'secret';
const AuthService = require('../backend/services/authService');

describe('AuthService.googleLogin', () => {
  it('creates a new user when none exists', async () => {
    const result = await AuthService.googleLogin('id', 'acc');
    expect(result.user.email).toBe('g@test.com');
    expect(saved.length).toBe(1);
  });
});
