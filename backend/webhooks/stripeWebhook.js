/**
 * Stripe webhook handler
 */
const stripeService = require('../services/stripeService');
const PaymentModel = require('../models/payment');
const SessionModel = require('../models/session');
const UserModel = require('../models/user');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Handle Stripe webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const payload = req.body;
  
  try {
    // Verify webhook signature
    const event = stripeService.handleWebhookEvent(payload, sig);
    logger.info(`Received Stripe webhook event: ${event.type}`);
    
    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
        
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
        
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;
        
      // Add more event types as needed
        
      default:
        logger.info(`Unhandled Stripe webhook event: ${event.type}`);
    }
    
    // Return success response
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

/**
 * Handle payment_intent.succeeded event
 * @param {Object} paymentIntent - Payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Find the payment by Stripe payment ID
    const payment = await PaymentModel.findByStripePaymentId(paymentIntent.id);
    
    if (!payment) {
      logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Mark payment as completed if not already
    if (payment.status !== 'completed') {
      await PaymentModel.update(payment.id, {
        status: 'completed',
        paid_at: new Date()
      });
      
      // Get session and user details
      const session = await SessionModel.findById(payment.session_id);
      const seeker = await UserModel.findById(payment.user_id);
      const professional = await UserModel.findById(session.professional_id);
      
      // Send payment confirmation email to seeker
      await emailService.sendPaymentConfirmation(seeker.email, {
        firstName: seeker.first_name,
        amount: `$${payment.amount}`,
        transactionId: payment.stripe_payment_id,
        professionalName: `${professional.first_name} ${professional.last_name}`,
        sessionDate: session.scheduled_at
      });
      
      // Send notification to seeker
      await notificationService.createNotification({
        user_id: seeker.id,
        title: 'Payment Confirmed',
        content: `Your payment of $${payment.amount} for the session with ${professional.first_name} ${professional.last_name} has been confirmed.`,
        type: 'payment'
      });
      
      // Send notification to professional
      await notificationService.createNotification({
        user_id: professional.id,
        title: 'Payment Received',
        content: `You've received a payment of $${payment.amount} for a session scheduled on ${new Date(session.scheduled_at).toLocaleString()}.`,
        type: 'payment'
      });
      
      logger.info(`Payment ${payment.id} marked as completed`);
    }
  } catch (error) {
    logger.error('Error handling payment_intent.succeeded event:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed event
 * @param {Object} paymentIntent - Payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    // Find the payment by Stripe payment ID
    const payment = await PaymentModel.findByStripePaymentId(paymentIntent.id);
    
    if (!payment) {
      logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Get error message
    const errorMessage = paymentIntent.last_payment_error
      ? paymentIntent.last_payment_error.message
      : 'Payment failed';
    
    // Mark payment as failed
    await PaymentModel.update(payment.id, {
      status: 'failed',
      feedback: errorMessage
    });
    
    // Get user details
    const user = await UserModel.findById(payment.user_id);
    
    // Send notification to user
    await notificationService.createNotification({
      user_id: user.id,
      title: 'Payment Failed',
      content: `Your payment of $${payment.amount} failed: ${errorMessage}. Please try again or use a different payment method.`,
      type: 'payment'
    });
    
    logger.info(`Payment ${payment.id} marked as failed: ${errorMessage}`);
  } catch (error) {
    logger.error('Error handling payment_intent.payment_failed event:', error);
    throw error;
  }
}

/**
 * Handle checkout.session.completed event
 * @param {Object} checkoutSession - Checkout session object
 */
async function handleCheckoutSessionCompleted(checkoutSession) {
  try {
    // Extract session ID from metadata
    const sessionId = checkoutSession.metadata.session_id;
    
    if (!sessionId) {
      logger.warn('Session ID not found in checkout session metadata');
      return;
    }
    
    // Check if payment already exists
    const existingPayment = await PaymentModel.findBySessionId(sessionId);
    
    if (existingPayment) {
      // Update existing payment
      await PaymentModel.update(existingPayment.id, {
        stripe_payment_id: checkoutSession.payment_intent,
        status: 'completed',
        paid_at: new Date()
      });
      
      logger.info(`Existing payment ${existingPayment.id} updated`);
    } else {
      // Create new payment record
      const payment = await PaymentModel.create({
        session_id: sessionId,
        user_id: checkoutSession.metadata.seeker_id,
        stripe_payment_id: checkoutSession.payment_intent,
        amount: checkoutSession.amount_total / 100, // Convert from cents to dollars
        currency: checkoutSession.currency,
        status: 'completed',
        paid_at: new Date()
      });
      
      logger.info(`New payment ${payment.id} created`);
    }
    
    // Get session and user details
    const session = await SessionModel.findById(sessionId);
    const seeker = await UserModel.findById(checkoutSession.metadata.seeker_id);
    const professional = await UserModel.findById(checkoutSession.metadata.professional_id);
    
    // Send payment confirmation email to seeker
    await emailService.sendPaymentConfirmation(seeker.email, {
      firstName: seeker.first_name,
      amount: `$${checkoutSession.amount_total / 100}`,
      transactionId: checkoutSession.payment_intent,
      professionalName: `${professional.first_name} ${professional.last_name}`,
      sessionDate: session.scheduled_at
    });
    
    // Send notifications
    await notificationService.createNotification({
      user_id: seeker.id,
      title: 'Payment Confirmed',
      content: `Your payment of $${checkoutSession.amount_total / 100} for the session with ${professional.first_name} ${professional.last_name} has been confirmed.`,
      type: 'payment'
    });
    
    await notificationService.createNotification({
      user_id: professional.id,
      title: 'Payment Received',
      content: `You've received a payment of $${checkoutSession.amount_total / 100} for a session scheduled on ${new Date(session.scheduled_at).toLocaleString()}.`,
      type: 'payment'
    });
  } catch (error) {
    logger.error('Error handling checkout.session.completed event:', error);
    throw error;
  }
}

/**
 * Handle charge.refunded event
 * @param {Object} charge - Charge object
 */
async function handleChargeRefunded(charge) {
  try {
    // Find the payment by Stripe payment ID
    const payment = await PaymentModel.findByStripePaymentId(charge.payment_intent);
    
    if (!payment) {
      logger.warn(`Payment not found for payment intent: ${charge.payment_intent}`);
      return;
    }
    
    // Mark payment as refunded if not already
    if (payment.status !== 'refunded') {
      await PaymentModel.update(payment.id, {
        status: 'refunded'
      });
      
      // Get session and user details
      const session = await SessionModel.findById(payment.session_id);
      const seeker = await UserModel.findById(payment.user_id);
      const professional = await UserModel.findById(session.professional_id);
      
      // Determine refund reason
      let refundReason = 'Requested by user';
      if (session.status === 'cancelled') {
        refundReason = 'Session cancelled';
      }
      
      // Send refund email to seeker
      await emailService.sendPaymentRefund(seeker.email, {
        firstName: seeker.first_name,
        amount: `$${payment.amount}`,
        transactionId: payment.stripe_payment_id,
        professionalName: `${professional.first_name} ${professional.last_name}`,
        reason: refundReason
      });
      
      // Send notification to seeker
      await notificationService.createNotification({
        user_id: seeker.id,
        title: 'Payment Refunded',
        content: `Your payment of $${payment.amount} for the session with ${professional.first_name} ${professional.last_name} has been refunded.`,
        type: 'payment'
      });
      
      // Send notification to professional
      await notificationService.createNotification({
        user_id: professional.id,
        title: 'Payment Refunded',
        content: `A payment of $${payment.amount} for a session has been refunded to the seeker.`,
        type: 'payment'
      });
      
      logger.info(`Payment ${payment.id} marked as refunded`);
    }
  } catch (error) {
    logger.error('Error handling charge.refunded event:', error);
    throw error;
  }
}

/**
 * Handle account.updated event
 * @param {Object} account - Stripe account object
 */
async function handleAccountUpdated(account) {
  try {
    // Check if this is a professional's connected account
    const professionalId = account.metadata.professional_id;
    
    if (!professionalId) {
      logger.info('Not a professional account, skipping');
      return;
    }
    
    // Get professional details
    const professional = await UserModel.findById(professionalId);
    
    if (!professional) {
      logger.warn(`Professional not found for ID: ${professionalId}`);
      return;
    }
    
    // Check if account is now fully onboarded
    if (account.charges_enabled && !account.details_submitted) {
      // Send notification to professional
      await notificationService.createNotification({
        user_id: professional.id,
        title: 'Stripe Account Setup Completed',
        content: 'Your Stripe account setup is now complete. You can now receive payments for your sessions.',
        type: 'system'
      });
      
      logger.info(`Professional ${professionalId} Stripe account setup completed`);
    }
  } catch (error) {
    logger.error('Error handling account.updated event:', error);
    throw error;
  }
}

/**
 * Handle payout.paid event
 * @param {Object} payout - Payout object
 */
async function handlePayoutPaid(payout) {
  try {
    // Check if this is a professional's payout
    const accountId = payout.destination;
    
    // Find the professional associated with this Stripe account
    const professional = await findProfessionalByStripeAccount(accountId);
    
    if (!professional) {
      logger.warn(`Professional not found for Stripe account: ${accountId}`);
      return;
    }
    
    // Send payout notification email
    await emailService.sendPayoutNotification(professional.email, {
      firstName: professional.first_name,
      amount: `$${payout.amount / 100}`,
      transactionId: payout.id,
      sessionCount: 'your recent' // This would be more specific in a real implementation
    });
    
    // Send notification to professional
    await notificationService.createNotification({
      user_id: professional.id,
      title: 'Payout Sent',
      content: `A payout of $${payout.amount / 100} has been sent to your account. The funds should appear in your account within 3-5 business days.`,
      type: 'payment'
    });
    
    logger.info(`Payout notification sent to professional ${professional.id}`);
  } catch (error) {
    logger.error('Error handling payout.paid event:', error);
    throw error;
  }
}

/**
 * Helper function to find a professional by Stripe account ID
 * @param {string} accountId - Stripe account ID
 * @returns {Object|null} Professional user object or null if not found
 */
async function findProfessionalByStripeAccount(accountId) {
  // This is a simplified implementation
  // In a real application, you would store Stripe account IDs in a database
  // and lookup the professional using that
  
  // For now, we'll just return null
  // This would need to be implemented based on your data model
  return null;
}
