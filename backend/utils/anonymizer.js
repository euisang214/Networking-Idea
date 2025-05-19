// Utility for anonymizing professional profiles
class Anonymizer {
  constructor() {
    this.companyTypes = [
      'Fortune 500', 'Tech Giant', 'Startup', 'Industry Leader',
      'Global Enterprise', 'Mid-size Company', 'Innovative Firm',
      'Market Leader', 'Boutique Firm', 'Established Company'
    ];
    
    this.titleLevels = [
      'Junior', 'Mid-level', 'Senior', 'Lead', 'Principal',
      'Staff', 'Distinguished', 'Chief', 'Head of', 'Director of'
    ];
  }

  // Main function to anonymize a professional profile
  async anonymizeProfile(profile) {
    try {
      // Generate display name based on experience
      let displayName = this.generateDisplayName(profile);
      
      // Anonymize company
      let anonymizedCompany = this.anonymizeCompany(profile);
      
      // Anonymize title
      let anonymizedTitle = this.anonymizeTitle(profile);
      
      // Anonymize bio
      let anonymizedBio = this.anonymizeBio(profile.bio);
      
      // Set the anonymized profile fields
      profile.anonymizedProfile = {
        displayName,
        anonymizedCompany,
        anonymizedTitle,
        anonymizedBio
      };
      
      return profile;
    } catch (error) {
      console.error('Anonymization error:', error);
      throw new Error(`Failed to anonymize profile: ${error.message}`);
    }
  }

  // Generate a display name that doesn't reveal identity
  generateDisplayName(profile) {
    const experienceLevel = this.getExperienceLevel(profile.yearsOfExperience);
    const industryName = profile.industry ? profile.industry.name : 'Professional';
    
    return `${experienceLevel} ${industryName} Professional`;
  }

  // Determine experience level based on years
  getExperienceLevel(years) {
    if (years < 3) return 'Entry-Level';
    if (years < 6) return 'Mid-Level';
    if (years < 10) return 'Senior';
    if (years < 15) return 'Experienced';
    return 'Veteran';
  }

  // Anonymize company name
  anonymizeCompany(profile) {
    const companyType = this.companyTypes[Math.floor(Math.random() * this.companyTypes.length)];
    const industryName = profile.industry ? profile.industry.name : 'Industry';
    
    return `${companyType} in ${industryName}`;
  }

  // Anonymize job title
  anonymizeTitle(profile) {
    // Preserve original title but remove company-specific terms
    let genericTitle = profile.title
      .replace(/at\s+[\w\s]+/i, '')
      .replace(/[a-z0-9]+\s*[-–—]\s*/i, '')
      .trim();
    
    // Add a random level prefix if not already present
    const hasLevel = this.titleLevels.some(level => 
      genericTitle.toLowerCase().includes(level.toLowerCase())
    );
    
    if (!hasLevel) {
      const level = this.titleLevels[Math.floor(Math.random() * this.titleLevels.length)];
      genericTitle = `${level} ${genericTitle}`;
    }
    
    return genericTitle;
  }

  // Anonymize bio by removing identifiable information
  anonymizeBio(bio) {
    if (!bio) return '';
    
    return bio
      // Replace first-person pronouns with third-person
      .replace(/\b(I|my|mine|myself)\b/gi, 'they')
      .replace(/\b(we|our|us|ourselves)\b/gi, 'they')
      // Replace specific company references
      .replace(/\b(at|with|for)\s+[\w\s&]+\b/gi, match => {
        // Keep the preposition but replace the company
        const preposition = match.split(/\s+/)[0];
        return `${preposition} their company`;
      })
      // Remove specific locations
      .replace(/\bin\s+[\w\s,]+\b/gi, 'in their location')
      // Remove specific university names
      .replace(/\b(graduated|studied|degree)\s+(from|at)\s+[\w\s]+\b/gi, match => {
        const parts = match.split(/\s+/);
        const action = parts[0];
        return `${action} at a top university`;
      })
      // Remove specific years
      .replace(/\b(in|since|from)\s+\d{4}\b/gi, match => {
        const preposition = match.split(/\s+/)[0];
        return `${preposition} recent years`;
      });
  }
}

module.exports = new Anonymizer();