const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const ComplianceController = require('../controllers/complianceController');
const authenticate = require('../middlewares/authenticate');
const { validate, schemas } = require('../utils/validation');
const { validators } = schemas;

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.put(
  '/profile',
  validate([validators.firstName, validators.lastName, validators.resume]),
  UserController.updateProfile
);

// Delete user account
router.delete('/account', UserController.deleteAccount);

// Permanently delete user data (GDPR)
router.delete('/me/delete', ComplianceController.deleteMe);

// Get user type
router.get('/type', UserController.getUserType);

// Set user type
router.put('/type', UserController.setUserType);

// Get Google Calendar availability for current user
router.get('/calendar-availability', UserController.getCalendarAvailability);

module.exports = router;
