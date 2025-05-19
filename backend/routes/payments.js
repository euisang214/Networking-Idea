const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authenticate = require('../middlewares/authenticate');
const { validators, validate } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Process session payment
router.post('/session', [
  validators.paymentMethodId,
  validate
], PaymentController.processSessionPayment);

// Release session payment (admin only)
router.post('/session/:sessionId/release', [
  validators.sessionId,
  validate
], PaymentController.releaseSessionPayment);

// Process referral payment (admin only)
router.post('/referral/:referralId/process', [
  validators.referralId,
  validate
], PaymentController.processReferralPayment);

// Create checkout session for subscription
router.post('/checkout', PaymentController.createCheckoutSession);

// Create Stripe connected account
router.post('/connect-account', PaymentController.createConnectedAccount);

module.exports = router;