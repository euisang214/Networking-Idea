const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validators, validate } = require('../utils/validators');
const authenticate = require('../middlewares/authenticate');

// Public routes
router.post('/register', [
  validators.email,
  validators.password,
  validators.firstName,
  validators.lastName,
  validators.userType,
  validate
], AuthController.register);

router.post('/login', [
  validators.email,
  validators.password,
  validate
], AuthController.login);

router.get('/verify-email', AuthController.verifyEmail);

router.post('/forgot-password', [
  validators.email,
  validate
], AuthController.requestPasswordReset);

router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);

router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;