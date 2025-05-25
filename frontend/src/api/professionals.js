import api from '../services/api/client';

const ProfessionalsAPI = {
  // Search for professionals with filters
  searchProfessionals: async (filters = {}, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.industry) queryParams.append('industry', filters.industry);
    if (filters.skills && filters.skills.length) queryParams.append('skills', filters.skills.join(','));
    if (filters.minExperience) queryParams.append('minExperience', filters.minExperience);
    if (filters.maxRate) queryParams.append('maxRate', filters.maxRate);
    
    // Add pagination
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await api.get(`/professionals/search?${queryParams.toString()}`);
    return response.data;
  },
  
  // Get all industries
  getIndustries: async () => {
    const response = await api.get('/professionals/industries');
    return response.data.data.industries;
  },
  
  // Get professional profile by ID
  getProfile: async (profileId) => {
    const response = await api.get(`/professionals/${profileId}`);
    return response.data.data.profile;
  },
  
  // Get own professional profile
  getOwnProfile: async () => {
    const response = await api.get('/professionals/me/profile');
    return response.data.data.profile;
  },
  
  // Create professional profile
  createProfile: async (profileData) => {
    const response = await api.post('/professionals', profileData);
    return response.data.data.profile;
  },
  
  // Update professional profile
  updateProfile: async (profileId, updateData) => {
    const response = await api.put(`/professionals/${profileId}`, updateData);
    return response.data.data.profile;
  },
  
  // Create Stripe connected account
  createConnectedAccount: async () => {
    const response = await api.post('/professionals/connect-account');
    return response.data.data;
  }
};

export default ProfessionalsAPI;