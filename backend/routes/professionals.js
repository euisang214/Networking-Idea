const express = require('express');
const router = express.Router();
const ProfessionalController = require('../controllers/professionalController');
const authenticate = require('../middlewares/authenticate');
const { validate, schemas } = require('../utils/validation');
const { validators } = schemas;
const rolesAllowed = require('../middlewares/rolesAllowed');

// Public routes
router.get('/search', ProfessionalController.searchProfessionals);
router.get('/industries', ProfessionalController.getIndustries);
router.get(
  '/:profileId',
  validate(validators.professionalId),
  ProfessionalController.getProfile
);

// Protected routes
router.use(authenticate);
router.use(rolesAllowed(['professional']));

// Create professional profile
router.post(
  '/',
  validate([validators.hourlyRate, validators.yearsOfExperience]),
  ProfessionalController.createProfile
);

// Get own professional profile
router.get('/me/profile', ProfessionalController.getOwnProfile);

// Update professional profile
router.put(
  '/:profileId',
  validate(validators.professionalId),
  ProfessionalController.updateProfile
);

// Create Stripe connected account
router.post('/connect-account', ProfessionalController.createConnectedAccount);

module.exports = router;