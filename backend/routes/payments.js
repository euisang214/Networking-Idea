const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authenticate = require('../middlewares/authenticate');
const { validate, schemas } = require('../utils/validation');
const { validators } = schemas;

// All routes require authentication
router.use(authenticate);

// Process session payment
router.post(
  '/session',
  validate(validators.paymentMethodId),
  PaymentController.processSessionPayment
);

// Release session payment (admin only)
router.post(
  '/session/:sessionId/release',
  validate(validators.sessionId),
  PaymentController.releaseSessionPayment
);

// Process referral payment (admin only)
router.post(
  '/referral/:referralId/process',
  validate(validators.referralId),
  PaymentController.processReferralPayment
);

// Create checkout session for subscription
router.post('/checkout', PaymentController.createCheckoutSession);

// Create Stripe connected account
router.post('/connect-account', PaymentController.createConnectedAccount);

module.exports = router;