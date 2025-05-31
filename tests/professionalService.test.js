const { describe, it, expect, vi } = require('./test-helpers');

const chain = {
  populate: () => chain,
  sort: () => chain,
  skip: vi.fn(() => chain),
  limit: vi.fn(() => chain),
  exec: vi.fn(() => Promise.resolve(['pro']))
};

vi.mock('../backend/models/professionalProfile.js', () => ({
  find: vi.fn(() => chain),
  countDocuments: vi.fn(() => Promise.resolve(1))
}));

const ProfessionalService = require('../backend/services/professionalService');

describe('professional service', () => {
  it('searchProfessionals applies filters and pagination', async () => {
    const filters = { industry: 'ind', skills: ['js'], minExperience: 5, maxRate: 100 };
    const result = await ProfessionalService.searchProfessionals(filters, 10, 20);
    const expectedQuery = {
      isActive: true,
      isVerified: true,
      industry: 'ind',
      skills: { $in: ['js'] },
      yearsOfExperience: { $gte: 5 },
      hourlyRate: { $lte: 100 }
    };
    const model = require('../backend/models/professionalProfile.js');
    expect(model.find.mock.calls[0][0]).toEqual(expectedQuery);
    expect(chain.skip.mock.calls[0][0]).toBe(20);
    expect(chain.limit.mock.calls[0][0]).toBe(10);
    expect(result.total).toBe(1);
    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(1);
    expect(result.professionals.length).toBe(1);
  });
});
