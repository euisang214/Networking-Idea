const { describe, it, expect, vi } = require('./test-helpers');

const mockSession = {
  _id: 'sess1',
  professional: {
    _id: 'pro1',
    stripeConnectedAccountId: 'acct_1',
    user: 'proUser1',
    statistics: { completedSessions: 0, totalEarnings: 0 }
  },
  user: 'user1',
  price: 100,
  zoomMeetingVerified: true,
  status: 'completed',
  save: vi.fn()
};
vi.mock('../backend/models/session', () => ({
  findById: vi.fn(() => ({
    populate: () => ({
      populate: () => Promise.resolve(mockSession)
    })
  }))
}));

const mockUser = {
  _id: 'user1',
  email: 'user@test.com',
  firstName: 'User',
  lastName: 'Test',
  stripeCustomerId: null,
  save: vi.fn()
};
vi.mock('../backend/models/user', () => ({
  findById: vi.fn(() => Promise.resolve(mockUser))
}));
vi.mock('../backend/models/professionalProfile', () => ({
  findById: vi.fn(() => Promise.resolve({
    _id: 'pro1',
    statistics: { completedSessions: 0, totalEarnings: 0 },
    save: vi.fn()
  }))
}));
vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }));
const transferSpy = vi.fn(async () => ({ id: 'tr_1' }));
const paymentIntentCreateSpy = vi.fn(async () => ({
  id: 'pi_1',
  status: 'requires_capture',
  client_secret: 'sec',
  charges: { data: [{ receipt_url: 'http://r' }] }
}));
const paymentIntentCaptureSpy = vi.fn(async () => ({ id: 'pi_1', status: 'succeeded' }));
const customerCreateSpy = vi.fn(async () => ({ id: 'cus_1' }));
const stripeInstance = {
  transfers: { create: transferSpy },
  paymentIntents: { create: paymentIntentCreateSpy, capture: paymentIntentCaptureSpy },
  customers: { create: customerCreateSpy }
};
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

  it('creates payment intent with manual capture', async () => {
    await PaymentService.processSessionPayment('sess1', 'pm_1', 'user1');
    expect(paymentIntentCreateSpy.mock.calls[0][0].capture_method).toBe('manual');
    expect(mockSession.paymentStatus).toBe('authorized');
  });

  it('captures intent and transfers funds on release', async () => {
    mockSession.paymentId = 'pi_1';
    mockSession.paymentStatus = 'authorized';
    await PaymentService.releaseSessionPayment('sess1');
    expect(paymentIntentCaptureSpy).toHaveBeenCalledWith('pi_1');
    expect(transferSpy).toHaveBeenCalled();
    expect(mockSession.paymentStatus).toBe('released');
  });
});
