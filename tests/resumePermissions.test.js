const { describe, it, expect, vi } = require('./test-helpers');
const { AuthorizationError } = require('../backend/utils/errorTypes');

// Mocks for AuthService.register
const savedUsers = [];
class User {
  constructor(data) { Object.assign(this, data); }
  save = vi.fn(async () => { savedUsers.push(this); return this; });
  static async findOne() { return null; }
}
vi.mock('../backend/models/user', () => User);
vi.mock('../backend/services/emailService', () => ({ sendEmail: vi.fn() }));
vi.mock('../backend/services/googleService', () => ({ verifyIdToken: vi.fn(), getAvailability: vi.fn() }));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() }));
vi.mock('bcryptjs', () => ({ genSalt: vi.fn(), hash: vi.fn(), compare: vi.fn() }));
vi.mock('crypto', () => ({ randomBytes: () => Buffer.from('rand') }));
vi.mock('jsonwebtoken', () => ({ sign: () => 'token', verify: () => ({}) }));

const AuthService = require('../backend/services/authService');
const UserService = require('../backend/services/userService');

describe('resume permissions', () => {
  it('disallows resume upload for non-candidates during registration', async () => {
    await expect(
      AuthService.register({
        email: 'pro@test.com',
        password: 'Password1',
        firstName: 'Pro',
        lastName: 'User',
        userType: 'professional',
        resume: 'filedata'
      })
    ).rejects.toThrow('Only candidates can upload a resume');
  });

  it('disallows resume update for non-candidates', async () => {
    const user = { _id: '1', userType: 'professional', save: vi.fn() };
    vi.spyOn(UserService, 'getUserById').mockResolvedValue(user);
    await expect(
      UserService.updateProfile('1', { resume: 'data' })
    ).rejects.toThrow('Only candidates can upload a resume');
  });
});
