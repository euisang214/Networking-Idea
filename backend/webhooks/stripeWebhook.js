const express = require('express');
const router = express.Router();
const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);
const User = require('../models/user');
const ProfessionalProfile = require('../models/professionalProfile');
const Session = require('../models/session');
const Payment = require('../models/payment');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');
const { ExternalServiceError } = require('../utils/errorTypes');

// Verify Stripe webhook signature
const verifyStripeSignature = (req) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    return stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      config.stripe.webhookSecret
    );
  } catch (err) {
    logger.error(`Stripe webhook signature verification failed: ${err.message}`);
    return false;
  }
};

// Handle payment intent succeeded event
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    // Extract session ID from metadata
    const sessionId = paymentIntent.metadata.sessionId;
    
    if (!sessionId) {
      logger.warn('Payment intent succeeded but no sessionId in metadata');
      return null;
    }
    
    // Update session payment status
    const session = await Session.findById(sessionId);
    
    if (!session) {
      logger.warn(`Session ${sessionId} not found for payment intent ${paymentIntent.id}`);
      return null;
    }
    
    if (session.paymentStatus !== 'released') {
      session.paymentStatus = 'paid';
      await session.save();
    }
    
    // Create payment record
    const payment = new Payment({
      user: paymentIntent.metadata.userId,
      recipient: session.professional,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      description: `Payment for session with professional`,
      type: 'session',
      status: 'completed',
      paymentMethod: 'card',
      stripePaymentId: paymentIntent.id,
      session: sessionId,
      platformFee: {
        amount: paymentIntent.application_fee_amount ? paymentIntent.application_fee_amount / 100 : null,
        percentage: config.business.platformFeePercent
      },
      completedAt: new Date()
    });
    
    await payment.save();
    
    // Send notifications
    await NotificationService.sendNotification(payment.user, 'paymentSuccess', {
      sessionId,
      amount: payment.amount,
      paymentId: payment._id
    });
    
    await NotificationService.sendNotification(session.professional, 'paymentReceived', {
      sessionId,
      amount: payment.amount,
      paymentId: payment._id
    });
    
    // Send email confirmation
    const user = await User.findById(payment.user);
    await EmailService.sendPaymentConfirmation(payment, session, user);
    
    logger.info(`Payment recorded for session ${sessionId}: ${payment._id}`);
    
    return {
      success: true,
      paymentId: payment._id,
      sessionId
    };
  } catch (error) {
    logger.error(`Error handling payment intent succeeded: ${error.message}`);
    throw new ExternalServiceError(error.message, 'Stripe');
  }
};

// Handle account updated event
const handleAccountUpdated = async (account) => {
  try {
    // Find professional associated with this account
    const professional = await ProfessionalProfile.findOne({
      stripeConnectedAccountId: account.id
    });
    
    if (!professional) {
      logger.warn(`No professional found for Stripe account ${account.id}`);
      return null;
    }
    
    // Check if account is fully set up
    if (account.charges_enabled && !professional.isVerified) {
      professional.isVerified = true;
      professional.verificationDate = new Date();
      await professional.save();
      
      // Send notification
      await NotificationService.sendNotification(professional.user, 'accountVerified', {
        message: 'Your account has been verified and you can now receive payments'
      });
      
      logger.info(`Professional ${professional._id} verified through Stripe`);
    }
    
    return {
      success: true,
      professionalId: professional._id,
      verified: professional.isVerified
    };
  } catch (error) {
    logger.error(`Error handling account updated: ${error.message}`);
    throw new ExternalServiceError(error.message, 'Stripe');
  }
};

// Stripe webhook endpoint
router.post('/', async (req, res) => {
  try {
    // Verify webhook signature
    const event = verifyStripeSignature(req);
    
    if (!event) {
      return responseFormatter.error(res, 'Invalid signature', 401);
    }
    
    logger.info(`Received Stripe webhook: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentResult = await handlePaymentIntentSucceeded(event.data.object);
        return responseFormatter.success(res, paymentResult);
        
      case 'payment_intent.payment_failed':
        // Handle payment failure
        const failedPaymentIntent = event.data.object;
        logger.warn(`Payment failed: ${failedPaymentIntent.id}, reason: ${failedPaymentIntent.last_payment_error?.message || 'unknown'}`);
        return responseFormatter.success(res);
        
      case 'account.updated':
        const accountResult = await handleAccountUpdated(event.data.object);
        return responseFormatter.success(res, accountResult);
        
      case 'payout.created':
      case 'payout.paid':
        // Handle payouts to professionals
        // Could implement payout notification here
        return responseFormatter.success(res);
        
      default:
        // Acknowledge other event types
        logger.debug(`Unhandled Stripe event type: ${event.type}`);
        return responseFormatter.success(res);
    }
  } catch (error) {
    logger.error(`Stripe webhook error: ${error.message}`);
    return responseFormatter.serverError(res, error.message);
  }
});

module.exports = router;
