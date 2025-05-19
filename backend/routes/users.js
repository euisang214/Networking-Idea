const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authenticate = require('../middlewares/authenticate');
const { validators, validate } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', UserController.getProfile);

// Update user profile
router.put('/profile', [
  validators.firstName,
  validators.lastName,
  validate
], UserController.updateProfile);

// Delete user account
router.delete('/account', UserController.deleteAccount);

// Get user type
router.get('/type', UserController.getUserType);

// Set user type
router.put('/type', UserController.setUserType);

module.exports = router;