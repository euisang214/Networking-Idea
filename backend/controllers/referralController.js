const ReferralService = require('../services/referralService');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthorizationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// Controller for referral-related operations
const ReferralController = {
  // Create a new referral
  createReferral: async (req, res, next) => {
    try {
      const { candidateEmail, referralType } = req.body;
      const userId = req.user.id;
      
      // Validate required fields
      if (!candidateEmail) {
        throw new ValidationError('Candidate email is required');
      }
      
      // Get professional ID
      const professionalProfile = await req.app.get('db').professionalProfile.findOne({
        user: userId
      });
      
      if (!professionalProfile) {
        throw new ValidationError('You do not have a professional profile');
      }
      
      // Create referral
      const referral = await ReferralService.createReferral(
        professionalProfile._id,
        candidateEmail,
        referralType || 'link'
      );
      
      return responseFormatter.created(res, {
        referral
      }, 'Referral created successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get referral by ID
  getReferral: async (req, res, next) => {
    try {
      const { referralId } = req.params;
      const userId = req.user.id;
      
      // Get referral
      const referral = await ReferralService.getReferralById(referralId);
      
      // Check if user is authorized to view this referral
      const isProfessional = referral.professional.user.toString() === userId;
      const isCandidate = referral.candidate._id.toString() === userId;
      
      if (!isProfessional && !isCandidate) {
        throw new AuthorizationError('Not authorized to view this referral');
      }
      
      return responseFormatter.success(res, {
        referral
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get all referrals for a professional
  getProfessionalReferrals: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get professional ID
      const professionalProfile = await req.app.get('db').professionalProfile.findOne({
        user: userId
      });
      
      if (!professionalProfile) {
        throw new ValidationError('You do not have a professional profile');
      }
      
      // Get referrals
      const referrals = await ReferralService.getProfessionalReferrals(professionalProfile._id);
      
      return responseFormatter.success(res, {
        referrals
      }, 'Referrals retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get all referrals for a candidate
  getCandidateReferrals: async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get referrals
      const referrals = await ReferralService.getCandidateReferrals(userId);
      
      return responseFormatter.success(res, {
        referrals
      }, 'Referrals retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Unified endpoint to fetch referrals for the current user
  getMyReferrals: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;
      let referrals;

      if (userType === 'professional') {
        const professionalProfile = await req.app
          .get('db')
          .professionalProfile.findOne({ user: userId });
        if (!professionalProfile) {
          throw new ValidationError('You do not have a professional profile');
        }
        referrals = await ReferralService.getProfessionalReferrals(
          professionalProfile._id
        );
      } else if (userType === 'candidate') {
        referrals = await ReferralService.getCandidateReferrals(userId);
      } else {
        throw new AuthorizationError('Not authorized to view referrals');
      }

      return responseFormatter.success(res, { referrals });
    } catch (error) {
      next(error);
    }
  },
  
  // Manually verify a referral (admin only)
  verifyReferral: async (req, res, next) => {
    try {
      const { referralId } = req.params;
      const userId = req.user.id;
      
      // Check if user is an admin
      const user = await req.app.get('db').user.findById(userId);
      
      if (!user || user.userType !== 'admin') {
        throw new AuthorizationError('Only admins can manually verify referrals');
      }
      
      // Verify referral
      const referral = await ReferralService.verifyReferral(referralId);
      
      return responseFormatter.success(res, {
        referral
      }, 'Referral verified successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ReferralController;