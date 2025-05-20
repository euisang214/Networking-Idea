const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/referralController');
const authenticate = require('../middlewares/authenticate');
const { validators, validate } = require('../utils/validators');
const rolesAllowed = require('../middlewares/rolesAllowed');

// All routes require authentication
router.use(authenticate);

// Create referral
router.post(
  '/',
  rolesAllowed(['professional']),
  [validators.candidateEmail, validate],
  ReferralController.createReferral
);

// Get referral by ID
router.get('/:referralId', [
  validators.referralId,
  validate
], ReferralController.getReferral);

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
  [validators.referralId, validate],
  ReferralController.verifyReferral
);

module.exports = router;