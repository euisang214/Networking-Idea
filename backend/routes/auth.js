const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validators, validate } = require('../utils/validators');
const authenticate = require('../middlewares/authenticate');
const celebrate = require('../middlewares/schemaValidator');
const { authLimiter } = require('../middlewares/rateLimiter');
const Joi = celebrate.Joi;

// Public routes
router.post(
  '/register',
  authLimiter,
  celebrate({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      userType: Joi.string().valid('candidate','professional','admin')
    })
  }),
  AuthController.register
);

router.post(
  '/login',
  authLimiter,
  celebrate({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  }),
  AuthController.login
);

router.get('/verify-email', AuthController.verifyEmail);

router.post('/forgot-password', [
  authLimiter,
  validators.email,
  validate
], AuthController.requestPasswordReset);

router.post('/reset-password', authLimiter, AuthController.resetPassword);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);

router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;