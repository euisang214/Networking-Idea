import api from './index';

const ReferralsAPI = {
  // Create a new referral
  createReferral: async (candidateEmail, referralType) => {
    const response = await api.post('/referrals', {
      candidateEmail,
      referralType
    });
    return response.data.data.referral;
  },
  
  // Get referral by ID
  getReferral: async (referralId) => {
    const response = await api.get(`/referrals/${referralId}`);
    return response.data.data.referral;
  },
  
  // Get professional's referrals
  getProfessionalReferrals: async () => {
    const response = await api.get('/referrals/professional/me');
    return response.data.data.referrals;
  },
  
  // Get candidate's referrals
  getCandidateReferrals: async () => {
    const response = await api.get('/referrals/candidate/me');
    return response.data.data.referrals;
  }
};

export default ReferralsAPI;