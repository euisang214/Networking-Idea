const express = require('express');
const router = express.Router();
const ProfessionalController = require('../controllers/professionalController');
const authenticate = require('../middlewares/authenticate');
const { validators, validate } = require('../utils/validators');

// Public routes
router.get('/search', ProfessionalController.searchProfessionals);
router.get('/industries', ProfessionalController.getIndustries);
router.get('/:profileId', validators.professionalId, validate, ProfessionalController.getProfile);

// Protected routes
router.use(authenticate);

// Create professional profile
router.post('/', [
  validators.hourlyRate,
  validators.yearsOfExperience,
  validate
], ProfessionalController.createProfile);

// Get own professional profile
router.get('/me/profile', ProfessionalController.getOwnProfile);

// Update professional profile
router.put('/:profileId', [
  validators.professionalId,
  validate
], ProfessionalController.updateProfile);

// Create Stripe connected account
router.post('/connect-account', ProfessionalController.createConnectedAccount);

module.exports = router;