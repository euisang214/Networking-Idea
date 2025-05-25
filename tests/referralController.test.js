const { describe, it, expect, vi } = require('./test-helpers');

vi.mock('../backend/utils/logger', () => ({ info: vi.fn(), error: vi.fn() }));

vi.mock('../backend/services/referralService', () => ({
  getProfessionalReferrals: vi.fn(),
  getCandidateReferrals: vi.fn(),
}));
vi.mock('../backend/services/professionalService', () => ({
  getProfileByUserId: vi.fn(async (id) => ({ _id: id }))
}));

const responseFormatter = require('../backend/utils/responseFormatter');
vi.spyOn(responseFormatter, 'success');

const ReferralService = require('../backend/services/referralService');

const ReferralController = require('../backend/controllers/referralController');

function mockReq(user) {
  return { user };
}

describe('ReferralController.getMyReferrals', () => {
  it('fetches professional referrals', async () => {
    const req = mockReq({ id: 'prof1', userType: 'professional' });
    ReferralService.getProfessionalReferrals.mockReturnValue(Promise.resolve([{ _id: 'r' }]));
    const res = {};
    await ReferralController.getMyReferrals(req, res, () => {});
    expect(ReferralService.getProfessionalReferrals).toHaveBeenCalledWith('prof1');
    expect(responseFormatter.success).toHaveBeenCalled();
  });

  it('fetches candidate referrals', async () => {
    const req = mockReq({ id: '2', userType: 'candidate' });
    ReferralService.getCandidateReferrals.mockReturnValue(Promise.resolve([{ _id: 'r2' }]));
    const res = {};
    await ReferralController.getMyReferrals(req, res, () => {});
    expect(ReferralService.getCandidateReferrals).toHaveBeenCalledWith('2');
    expect(responseFormatter.success).toHaveBeenCalled();
  });
});
