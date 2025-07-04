const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);
const logger = require('../utils/logger');
const Session = require('../models/session');
const User = require('../models/user');
const ProfessionalProfile = require('../models/professionalProfile');
const Referral = require('../models/referral');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');

class PaymentService {
  constructor() {
    this.referralRewardAmount = config.business.referralRewardAmount;
    this.platformFeePercent = config.business.platformFeePercent;
  }

  // Process session payment from user
  async processSessionPayment(sessionId, paymentMethodId, userId) {
    try {
      const session = await Session.findById(sessionId)
                                  .populate('professional')
                                  .populate('user');
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Ensure user has a Stripe customer ID
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
        
        user.stripeCustomerId = customer.id;
        await user.save();
      }
      
      // Create payment intent with manual capture so funds are held until the session is verified
      const paymentIntent = await stripe.paymentIntents.create({
        amount: session.price * 100, // Convert to cents
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: paymentMethodId,
        capture_method: 'manual',
        off_session: false,
        confirm: true,
        description: `Session with ${session.professional.user.firstName} ${session.professional.user.lastName}`,
        metadata: {
          sessionId: session._id.toString(),
          userId: userId,
          professionalId: session.professional._id.toString()
        }
      });
      
      // Update session with payment information
      session.paymentId = paymentIntent.id;
      session.paymentStatus = 'paid';
      await session.save();
      
      // Send notifications
      await NotificationService.sendNotification(userId, 'paymentSuccess', {
        sessionId: session._id,
        amount: session.price,
        status: paymentIntent.status
      });
      
      // Send confirmation email
      await EmailService.sendPaymentConfirmation({
        _id: paymentIntent.id,
        amount: session.price,
        currency: 'usd',
        createdAt: new Date(),
        receiptUrl: paymentIntent.charges.data[0]?.receipt_url
      }, session, user);
      
      logger.info(`Payment processed for session ${sessionId}: ${paymentIntent.id}`);
      
      return {
        success: true,
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      logger.error(`Payment processing failed: ${error.message}`);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  // Release payment to professional after session verification
  async releaseSessionPayment(sessionId) {
    try {
      const session = await Session.findById(sessionId)
                                  .populate('professional')
                                  .populate('user');
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Verify session was completed successfully
      if (!session.zoomMeetingVerified || session.status !== 'completed') {
        throw new Error('Cannot release payment for unverified session');
      }
      
      // Check if payment was already released
      if (session.paymentStatus === 'released') {
        logger.warn(`Payment already released for session ${sessionId}`);
        return {
          success: true,
          alreadyReleased: true,
          sessionId: sessionId
        };
      }
      
      // Capture the held payment
      await stripe.paymentIntents.capture(session.paymentId);

      // Release payout via Stripe
      const payoutAmount = Math.round(session.price * (1 - this.platformFeePercent / 100) * 100);
      await stripe.transfers.create({
        amount: payoutAmount,
        currency: 'usd',
        destination: session.professional.stripeConnectedAccountId,
        description: `Payout for session ${session._id}`,
        metadata: { sessionId: session._id.toString() }
      }, { idempotencyKey: `session-${session._id.toString()}` });

      session.paymentStatus = 'released';
      await session.save();
      
      // Update professional statistics
      const professional = await ProfessionalProfile.findById(session.professional._id);
      professional.statistics.completedSessions += 1;
      professional.statistics.totalEarnings += session.price * (1 - this.platformFeePercent / 100);
      await professional.save();
      
      // Send notifications
      await NotificationService.sendNotification(session.professional.user, 'paymentReleased', {
        sessionId: session._id,
        amount: session.price * (1 - this.platformFeePercent / 100)
      });
      
      logger.info(`Payment released for session ${sessionId}`);
      
      return {
        success: true,
        sessionId: sessionId,
        amount: session.price * (1 - this.platformFeePercent / 100)
      };
    } catch (error) {
      logger.error(`Payment release failed: ${error.message}`);
      throw new Error(`Payment release failed: ${error.message}`);
    }
  }

  // Referral payouts are no longer issued
  async processReferralPayment() {
    logger.info('Referral payment logic disabled');
    return { success: false, message: 'Referral payouts are no longer supported' };
  }

  // Process offer bonus payment
async processOfferBonus(offerId) {
  try {
    const JobOffer = require('../models/jobOffer');
    const jobOffer = await JobOffer.findById(offerId)
      .populate('candidate')
      .populate('professional')
      .populate('session');

    if (!jobOffer) {
      throw new Error('Job offer not found');
    }

    if (jobOffer.status !== 'confirmed') {
      throw new Error('Cannot pay unconfirmed job offer');
    }

    if (jobOffer.status === 'paid') {
      logger.warn(`Offer bonus ${offerId} already paid`);
      return { success: true, alreadyPaid: true, offerId };
    }

    const professional = jobOffer.professional;

    // Process payout via Stripe
    const transfer = await stripe.transfers.create({
      amount: jobOffer.offerBonusAmount * 100, // in cents
      currency: 'usd',
      destination: professional.stripeConnectedAccountId,
      description: `Offer bonus for successful hire: ${jobOffer.candidate.firstName} ${jobOffer.candidate.lastName}`,
      metadata: {
        offerId: jobOffer._id.toString(),
        type: 'offer_bonus',
        candidateId: jobOffer.candidate._id.toString(),
        professionalId: professional._id.toString()
      }
    }, {
      idempotencyKey: `bonus-${jobOffer._id.toString()}`
    });

    // Send notifications
    await NotificationService.sendNotification(professional.user, 'offerBonusPaid', {
      offerId: jobOffer._id,
      amount: jobOffer.offerBonusAmount,
      candidateEmail: jobOffer.candidate.email
    });

    logger.info(`Offer bonus payment processed for offer ${offerId}: ${transfer.id}`);

    return {
      success: true,
      transferId: transfer.id,
      amount: jobOffer.offerBonusAmount,
      offerId: jobOffer._id
    };
  } catch (error) {
    logger.error(`Offer bonus payment failed: ${error.message}`);
    throw new Error(`Offer bonus payment failed: ${error.message}`);
  }
}

  // Create or retrieve Stripe checkout session for subscription
  async createCheckoutSession(userId, planType) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const prices = {
        basic: config.stripe.basicPriceId,
        premium: config.stripe.premiumPriceId,
        enterprise: config.stripe.enterprisePriceId
      };
      
      const priceId = prices[planType];
      if (!priceId) {
        throw new Error('Invalid plan type');
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: user.stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${config.app.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app.frontendUrl}/subscription/cancel`
      });
      
      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      logger.error(`Failed to create checkout session: ${error.message}`);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  

  // Create Stripe connected account for professional
  async createConnectedAccount(professionalId) {
    try {
      const professional = await ProfessionalProfile.findById(professionalId)
                                                  .populate('user');
      
      if (!professional) {
        throw new Error('Professional not found');
      }
      
      if (professional.stripeConnectedAccountId) {
        return {
          success: true,
          accountId: professional.stripeConnectedAccountId,
          alreadyExists: true
        };
      }
      
      const account = await stripe.accounts.create({
        type: 'express',
        email: professional.user.email,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          professionalId: professional._id.toString()
        }
      });
      
      professional.stripeConnectedAccountId = account.id;
      await professional.save();
      
      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${config.app.frontendUrl}/professional/onboarding/refresh`,
        return_url: `${config.app.frontendUrl}/professional/onboarding/complete`,
        type: 'account_onboarding'
      });
      
      logger.info(`Created Stripe connected account for professional ${professionalId}: ${account.id}`);
      
      return {
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url
      };
    } catch (error) {
      logger.error(`Failed to create connected account: ${error.message}`);
      throw new Error(`Failed to create connected account: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();