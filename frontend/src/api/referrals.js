import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const ReferralsAPI = {
  /**
   * Create a new referral
   * @param {string} candidateEmail - Candidate email
   * @param {string} referralType - Type of referral
   * @returns {Promise<Object>} Created referral
   */
  createReferral: (candidateEmail, referralType) =>
    handleRequest(
      api.post('/referrals', {
        candidateEmail,
        referralType
      })
    ),
  
  /**
   * Get referral by id
   * @param {string} referralId - Referral identifier
   * @returns {Promise<Object>} Referral data
   */
  getReferral: (referralId) =>
    handleRequest(api.get(`/referrals/${referralId}`)),
  
  /**
   * Get referrals for the authenticated professional
   * @returns {Promise<Array>} Referral array
   */
  getProfessionalReferrals: () =>
    handleRequest(api.get('/referrals/professional/me')),
  
  /**
   * Get referrals for the authenticated candidate
   * @returns {Promise<Array>} Referral array
   */
  getCandidateReferrals: () =>
    handleRequest(api.get('/referrals/candidate/me')),

  /**
   * Get all referrals for the current user
   * @returns {Promise<Array>} Referral array
   */
  getMyReferrals: () => handleRequest(api.get('/referrals/me'))
};

export default ReferralsAPI;