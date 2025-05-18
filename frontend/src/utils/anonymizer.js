/**
 * Utility for anonymizing user data
 * This helps comply with privacy requirements
 */

/**
 * Anonymize a name
 * @param {string} name - Name to anonymize
 * @returns {string} Anonymized name
 */
const anonymizeName = (name) => {
  if (!name) return '';
  
  // Keep the first letter and replace the rest with *
  const firstLetter = name.charAt(0);
  const anonymized = firstLetter + '*'.repeat(Math.max(2, name.length - 1));
  
  return anonymized;
};

/**
 * Anonymize an email address
 * @param {string} email - Email to anonymize
 * @returns {string} Anonymized email
 */
const anonymizeEmail = (email) => {
  if (!email) return '';
  
  // Split email at @ symbol
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  
  const localPart = parts[0];
  const domain = parts[1];
  
  // Keep the first 2 characters of local part and replace the rest with *
  const anonymizedLocal = localPart.substr(0, 2) + 
    '*'.repeat(Math.max(3, localPart.length - 2));
  
  // Keep the domain unchanged
  return `${anonymizedLocal}@${domain}`;
};

/**
 * Anonymize a company name
 * @param {string} company - Company name to anonymize
 * @returns {string} Anonymized company name
 */
const anonymizeCompany = (company) => {
  if (!company) return 'Company';
  
  // Replace with generic description
  return 'A Leading Company in this Industry';
};

/**
 * Anonymize a phone number
 * @param {string} phone - Phone number to anonymize
 * @returns {string} Anonymized phone number
 */
const anonymizePhone = (phone) => {
  if (!phone) return '';
  
  // Keep only the last 4 digits and mask the rest
  const cleanPhone = phone.replace(/\D/g, '');
  const length = cleanPhone.length;
  
  if (length <= 4) return phone;
  
  const lastFourDigits = cleanPhone.substr(length - 4);
  const maskedPart = '*'.repeat(length - 4);
  
  return `${maskedPart}${lastFourDigits}`;
};

/**
 * Anonymize a session transcript
 * @param {string} transcript - Session transcript
 * @param {Object} userInfo - User information to anonymize
 * @returns {string} Anonymized transcript
 */
const anonymizeTranscript = (transcript, userInfo) => {
  if (!transcript) return '';
  
  let anonymized = transcript;
  
  // Replace names
  if (userInfo.firstName) {
    const regex = new RegExp(`\\b${userInfo.firstName}\\b`, 'gi');
    anonymized = anonymized.replace(regex, `${userInfo.firstName.charAt(0)}***`);
  }
  
  if (userInfo.lastName) {
    const regex = new RegExp(`\\b${userInfo.lastName}\\b`, 'gi');
    anonymized = anonymized.replace(regex, `${userInfo.lastName.charAt(0)}***`);
  }
  
  // Replace email
  if (userInfo.email) {
    const regex = new RegExp(`\\b${userInfo.email}\\b`, 'gi');
    anonymized = anonymized.replace(regex, anonymizeEmail(userInfo.email));
  }
  
  // Replace company name
  if (userInfo.company) {
    const regex = new RegExp(`\\b${userInfo.company}\\b`, 'gi');
    anonymized = anonymized.replace(regex, anonymizeCompany(userInfo.company));
  }
  
  // Replace phone number
  if (userInfo.phone) {
    const regex = new RegExp(`\\b${userInfo.phone}\\b`, 'gi');
    anonymized = anonymized.replace(regex, anonymizePhone(userInfo.phone));
  }
  
  return anonymized;
};

/**
 * Generate a pseudonym for a user
 * @param {string} userId - User ID to generate pseudonym for
 * @returns {string} Pseudonym
 */
const generatePseudonym = (userId) => {
  if (!userId) return 'Anonymous User';
  
  // Use first 8 characters of userId to create a deterministic pseudonym
  const seed = userId.substring(0, 8);
  const namePrefixes = ['Tech', 'Data', 'Dev', 'Code', 'Cyber', 'Digital', 'Net', 'Web', 'Cloud', 'AI'];
  const nameSuffixes = ['Pro', 'Expert', 'Guru', 'Master', 'Wizard', 'Ninja', 'Champion', 'Specialist', 'Advocate', 'Mentor'];
  
  // Use the seed to deterministically select prefix and suffix
  // This ensures the same userId always gets the same pseudonym
  const prefixIndex = parseInt(seed.substring(0, 4), 16) % namePrefixes.length;
  const suffixIndex = parseInt(seed.substring(4, 8), 16) % nameSuffixes.length;
  
  return `${namePrefixes[prefixIndex]}${nameSuffixes[suffixIndex]}`;
};

module.exports = {
  anonymizeName,
  anonymizeEmail,
  anonymizeCompany,
  anonymizePhone,
  anonymizeTranscript,
  generatePseudonym
};
