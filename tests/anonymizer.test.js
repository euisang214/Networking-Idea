const { describe, it, expect, vi, beforeEach } = require('./test-helpers');
const anonymizer = require('../backend/utils/anonymizer');

describe('anonymizer utils', () => {
  beforeEach(() => {
    if (Math.random.mockRestore) Math.random.mockRestore();
    vi.spyOn(Math, 'random').mockImplementation(() => 0);
  });

  it('getExperienceLevel returns correct level', () => {
    expect(anonymizer.getExperienceLevel(1)).toBe('Entry-Level');
    expect(anonymizer.getExperienceLevel(4)).toBe('Mid-Level');
    expect(anonymizer.getExperienceLevel(8)).toBe('Senior');
    expect(anonymizer.getExperienceLevel(12)).toBe('Experienced');
    expect(anonymizer.getExperienceLevel(20)).toBe('Veteran');
  });

  it('generateDisplayName composes name from industry and experience', () => {
    const prof = { yearsOfExperience: 7, industry: { name: 'Software' } };
    expect(anonymizer.generateDisplayName(prof)).toBe('Senior Software Professional');
  });

  it('anonymizeTitle prefixes a level when none present', () => {
    const title = anonymizer.anonymizeTitle({ title: 'Engineer' });
    expect(title.startsWith('Junior')).toBe(true);
    expect(title.endsWith('Engineer')).toBe(true);
  });

  it('anonymizeBio removes personal references', () => {
    const bio = 'I worked at Big Corp in New York since 2010';
    const out = anonymizer.anonymizeBio(bio);
    expect(out.includes('they')).toBe(true);
    expect(out.includes('their company')).toBe(true);
    expect(out.includes('2010')).toBe(false);
    expect(out.includes('Big Corp')).toBe(false);
  });

  it('anonymizeProfile sets anonymizedProfile fields', async () => {
    const profile = {
      yearsOfExperience: 2,
      industry: { name: 'Tech' },
      title: 'Developer at MyCo',
      bio: 'I work at MyCo'
    };
    await anonymizer.anonymizeProfile(profile);
    expect(profile.anonymizedProfile == null).toBe(false);
    expect(profile.anonymizedProfile.displayName).toBe('Entry-Level Tech Professional');
    expect(profile.anonymizedProfile.anonymizedCompany.includes('in Tech')).toBe(true);
    expect(profile.anonymizedProfile.anonymizedTitle.endsWith('Developer')).toBe(true);
    expect(profile.anonymizedProfile.anonymizedBio.includes('their company')).toBe(true);
  });
});
