const { describe, it, expect, vi } = require('./test-helpers');

vi.mock('../backend/models/session', () => ({}));
vi.mock('../backend/models/user', () => ({}));
vi.mock('../backend/models/professionalProfile', () => ({}));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }));
const transferSpy = vi.fn(async () => ({ id: 'tr_1' }));
const stripeInstance = { transfers: { create: transferSpy } };
vi.mock('stripe', () => {
  return () => stripeInstance;
});

const mockReferral = {
  _id: 'ref1',
  professional: {
    _id: 'pro1',
    stripeConnectedAccountId: 'acct_1',
    user: 'u1',
    statistics: { successfulReferrals: 0 },
    save: vi.fn(),
  },
  candidate: { _id: 'cand1', email: 'c@example.com' },
  emailDomainVerified: true,
  status: 'verified',
  save: vi.fn()
};

vi.mock('../backend/models/referral', () => ({
  findById: () => ({
    populate: () => ({
      populate: () => Promise.resolve(mockReferral)
    })
  })
}));

vi.mock('../backend/services/notificationService', () => ({
  sendNotification: vi.fn()
}));

vi.mock('../backend/services/emailService', () => ({
  sendPaymentConfirmation: vi.fn(),
  sendPayoutNotification: vi.fn()
}));

const PaymentService = require('../backend/services/paymentService');

process.env.REFERRAL_REWARD_AMOUNT = '50';

describe('payment service', () => {
  it('uses idempotency key for referral payouts', async () => {
    await PaymentService.processReferralPayment('ref1');
    expect(transferSpy.mock.calls[0][1]).toEqual({ idempotencyKey: 'referral-ref1' });
  });
});
