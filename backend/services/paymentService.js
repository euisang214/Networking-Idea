const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const Session = require('../models/session');
const User = require('../models/user');
const ProfessionalProfile = require('../models/professionalProfile');
const Referral = require('../models/referral');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');

class PaymentService {
  constructor() {
    this.referralRewardAmount = parseInt(process.env.REFERRAL_REWARD_AMOUNT || 50, 10);
    this.platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || 15);
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
      
      // Calculate platform fee amount
      const platformFeeAmount = Math.round(session.price * (this.platformFeePercent / 100));
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: session.price * 100, // Convert to cents
        currency: 'usd',
        customer: user.stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: false,
        confirm: true,
        description: `Session with ${session.professional.anonymizedProfile.displayName}`,
        metadata: {
          sessionId: session._id.toString(),
          userId: userId,
          professionalId: session.professional._id.toString()
        },
        application_fee_amount: platformFeeAmount * 100, // Convert to cents
        transfer_data: {
          destination: session.professional.stripeConnectedAccountId,
        }
      });
      
      // Update session with payment information
      session.paymentId = paymentIntent.id;
      session.paymentStatus = paymentIntent.status === 'succeeded' ? 'paid' : 'pending';
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

  // Process referral reward
  async processReferralPayment(referralId) {
    try {
      const referral = await Referral.findById(referralId)
                                    .populate('professional')
                                    .populate('candidate');
      
      if (!referral) {
        throw new Error('Referral not found');
      }
      
      // Verify referral meets criteria
      if (!referral.emailDomainVerified || referral.status !== 'verified') {
        throw new Error('Cannot reward unverified referral');
      }
      
      // Check if already rewarded
      if (referral.status === 'rewarded') {
        logger.warn(`Referral ${referralId} already rewarded`);
        return {
          success: true,
          alreadyRewarded: true,
          referralId: referralId
        };
      }
      
      const professional = referral.professional;
      
      // Process payout via Stripe
      const transfer = await stripe.transfers.create({
        amount: this.referralRewardAmount * 100, // in cents
        currency: 'usd',
        destination: professional.stripeConnectedAccountId,
        description: `Referral reward for candidate ${referral.candidate.email}`,
        metadata: {
          referralId: referral._id.toString(),
          professionalId: professional._id.toString(),
          candidateId: referral.candidate._id.toString()
        }
      }, {
        idempotencyKey: `referral-${referral._id.toString()}`
      });
      
      // Update referral status
      referral.status = 'rewarded';
      referral.paymentStatus = 'paid';
      referral.paymentId = transfer.id;
      referral.rewardAmount = this.referralRewardAmount;
      referral.payoutDate = new Date();
      await referral.save();
      
      // Update professional statistics
      professional.statistics.successfulReferrals += 1;
      await professional.save();
      
      // Send notifications
      await NotificationService.sendNotification(professional.user, 'referralRewarded', {
        referralId: referral._id,
        amount: this.referralRewardAmount,
        candidateEmail: referral.candidate.email
      });
      
      logger.info(`Referral payment processed for referral ${referralId}: ${transfer.id}`);
      
      return {
        success: true,
        transferId: transfer.id,
        amount: this.referralRewardAmount,
        referralId: referralId
      };
    } catch (error) {
      logger.error(`Referral payment failed: ${error.message}`);
      throw new Error(`Referral payment failed: ${error.message}`);
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
        basic: process.env.STRIPE_BASIC_PRICE_ID,
        premium: process.env.STRIPE_PREMIUM_PRICE_ID,
        enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
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
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
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
        refresh_url: `${process.env.FRONTEND_URL}/professional/onboarding/refresh`,
        return_url: `${process.env.FRONTEND_URL}/professional/onboarding/complete`,
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