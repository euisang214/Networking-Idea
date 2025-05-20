const { describe, it, expect, vi } = require('./test-helpers');

vi.mock('../backend/models/user', () => ({ findByIdAndDelete: vi.fn() }));
vi.mock('../backend/models/message', () => ({ deleteMany: vi.fn() }));
vi.mock('../backend/models/session', () => ({ deleteMany: vi.fn() }));
vi.mock('../backend/models/referral', () => ({ deleteMany: vi.fn() }));
vi.mock('../backend/models/payment', () => ({ deleteMany: vi.fn() }));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn() }));

const { gdprDeleteUser } = require('../backend/utils/compliance');
const User = require('../backend/models/user');
const Message = require('../backend/models/message');
const Session = require('../backend/models/session');

describe('compliance utils', () => {
  it('gdprDeleteUser removes user data', async () => {
    await gdprDeleteUser('u1');
    expect(Message.deleteMany).toHaveBeenCalled();
    expect(Session.deleteMany).toHaveBeenCalled();
    expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
  });
});
