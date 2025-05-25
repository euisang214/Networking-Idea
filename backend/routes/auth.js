const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const { validate, schemas } = require('../utils/validation');
const { validators, authSchemas } = schemas;
const { authLimiter } = require('../middlewares/rateLimiter');

// Public routes
router.post(
  '/register',
  authLimiter,
  validate(authSchemas.register),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authSchemas.login),
  AuthController.login
);

router.post(
  '/google',
  authLimiter,
  validate(authSchemas.google),
  AuthController.googleAuth
);

router.get('/verify-email', AuthController.verifyEmail);

router.post(
  '/forgot-password',
  authLimiter,
  validate(validators.email),
  AuthController.requestPasswordReset
);

router.post('/reset-password', authLimiter, AuthController.resetPassword);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);

router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;