import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const ProfessionalsAPI = {
  /**
   * Search for professionals with filters
   * @param {Object} filters - Search filters
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Paginated professionals
   */
  getProfessionals: (filters = {}, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.industry) queryParams.append('industry', filters.industry);
    if (filters.skills && filters.skills.length) queryParams.append('skills', filters.skills.join(','));
    if (filters.minExperience) queryParams.append('minExperience', filters.minExperience);
    if (filters.maxRate) queryParams.append('maxRate', filters.maxRate);
    
    // Add pagination
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    return handleRequest(
      api.get(`/professionals/search?${queryParams.toString()}`)
    );
  },
  
  /**
   * Retrieve list of industries
   * @returns {Promise<Array>} Industry array
   */
  getIndustries: () => handleRequest(api.get('/professionals/industries')),
  
  /**
   * Get a professional profile by id
   * @param {string} profileId - Profile identifier
   * @returns {Promise<Object>} Profile data
   */
  getProfile: (profileId) => handleRequest(api.get(`/professionals/${profileId}`)),
  
  /**
   * Get the authenticated professional profile
   * @returns {Promise<Object>} Profile data
   */
  getOwnProfile: () => handleRequest(api.get('/professionals/me/profile')),
  
  /**
   * Create a professional profile
   * @param {Object} profileData - Profile details
   * @returns {Promise<Object>} Created profile
   */
  createProfile: (profileData) =>
    handleRequest(api.post('/professionals', profileData)),
  
  /**
   * Update a professional profile
   * @param {string} profileId - Profile identifier
   * @param {Object} updateData - Updated fields
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: (profileId, updateData) =>
    handleRequest(api.put(`/professionals/${profileId}`, updateData)),
  
  /**
   * Create a Stripe connected account for payouts
   * @returns {Promise<Object>} Stripe onboarding data
   */
  createConnectedAccount: () =>
    handleRequest(api.post('/professionals/connect-account'))
};

export default ProfessionalsAPI;