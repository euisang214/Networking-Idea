const { describe, it, expect, vi } = require('./test-helpers');

vi.mock('../backend/models/user', () => ({}));
vi.mock('../backend/models/professionalProfile', () => ({}));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }));
vi.mock('../backend/services/paymentService', () => ({
  processReferralPayment: vi.fn()
}));
vi.mock('../backend/services/emailService', () => ({ sendReferralEmail: vi.fn() }));

process.env.MAX_REWARD_PER_PRO = '5';
process.env.COOLDOWN_DAYS = '7';
const paymentService = require('../backend/services/paymentService');

const mockReferral = {
  _id: 'ref1',
  professional: 'pro1',
  referralType: 'email',
  emailDetails: { senderDomain: 'x.com', recipientDomain: 'x.com' },
  emailDomainVerified: false,
  status: 'pending',
  save: vi.fn()
};

vi.mock('../backend/models/referral.js', () => ({
  findById: vi.fn(() => Promise.resolve({ ...mockReferral })),
  countDocuments: vi.fn(() => Promise.resolve(5)),
  findOne: vi.fn(() => Promise.resolve({ payoutDate: new Date() }))
}));

vi.mock('../backend/services/notificationService', () => ({
  sendNotification: vi.fn()
}));

const ReferralService = require('../backend/services/referralService');

process.env.MAX_REWARD_PER_PRO = '5';
process.env.COOLDOWN_DAYS = '7';

describe('referral service', () => {
  it('verifies referral without triggering payout', async () => {
    const result = await ReferralService.verifyReferral('ref1');
    expect(result.status).toBe('verified');
    expect(paymentService.processReferralPayment.mock.calls.length).toBe(0);
  });
});
