const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/referralController');
const authenticate = require('../middlewares/authenticate');
const { validate, schemas } = require('../utils/validation');
const { validators } = schemas;
const rolesAllowed = require('../middlewares/rolesAllowed');

// All routes require authentication
router.use(authenticate);

// Create referral
router.post(
  '/',
  rolesAllowed(['professional']),
  validate(validators.candidateEmail),
  ReferralController.createReferral
);

// Get referrals for current user (professional or candidate)
router.get('/me', ReferralController.getMyReferrals);

// Get referral by ID
router.get(
  '/:referralId',
  validate(validators.referralId),
  ReferralController.getReferral
);

// Get all referrals for professional
router.get(
  '/professional/me',
  rolesAllowed(['professional']),
  ReferralController.getProfessionalReferrals
);

// Get all referrals for candidate
router.get(
  '/candidate/me',
  rolesAllowed(['candidate']),
  ReferralController.getCandidateReferrals
);

// Verify referral (admin only)
router.put(
  '/:referralId/verify',
  rolesAllowed(['admin']),
  validate(validators.referralId),
  ReferralController.verifyReferral
);

module.exports = router;