const cron = require('node-cron');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const ProfessionalProfile = require('../models/professionalProfile');
const Session = require('../models/session');
const Referral = require('../models/referral');
const Payment = require('../models/payment');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Payout processing job
 * Processes payouts for professionals based on their settings
 * Runs daily at 2:00 AM
 */
const payoutJob = cron.schedule('0 2 * * *', async () => {
  logger.info('Running professional payout job');
  
  try {
    // Process payouts based on professional payout schedules
    await processWeeklyPayouts();
    await processMonthlyPayouts();
    await processDailyPayouts();
    
    logger.info('Payout job completed successfully');
  } catch (error) {
    logger.error(`Error in payout job: ${error.message}`, { error });
  }
});

/**
 * Process weekly payouts (runs on Mondays)
 */
async function processWeeklyPayouts() {
  const today = new Date();
  // Only run weekly payouts on Mondays (day 1)
  if (today.getDay() !== 1) return;
  
  try {
    const professionals = await ProfessionalProfile.find({
      'payoutSettings.payoutSchedule': 'weekly',
      isActive: true,
      isVerified: true,
      stripeConnectedAccountId: { $exists: true, $ne: null }
    }).populate('user');
    
    logger.info(`Processing weekly payouts for ${professionals.length} professionals`);
    
    for (const professional of professionals) {
      await processPayout(professional);
    }
  } catch (error) {
    logger.error(`Error in weekly payout processing: ${error.message}`);
  }
}

/**
 * Process monthly payouts (runs on the 1st of each month)
 */
async function processMonthlyPayouts() {
  const today = new Date();
  // Only run monthly payouts on the 1st of the month
  if (today.getDate() !== 1) return;
  
  try {
    const professionals = await ProfessionalProfile.find({
      'payoutSettings.payoutSchedule': 'monthly',
      isActive: true,
      isVerified: true,
      stripeConnectedAccountId: { $exists: true, $ne: null }
    }).populate('user');
    
    logger.info(`Processing monthly payouts for ${professionals.length} professionals`);
    
    for (const professional of professionals) {
      await processPayout(professional);
    }
  } catch (error) {
    logger.error(`Error in monthly payout processing: ${error.message}`);
  }
}

/**
 * Process daily payouts
 */
async function processDailyPayouts() {
  try {
    const professionals = await ProfessionalProfile.find({
      'payoutSettings.payoutSchedule': 'daily',
      isActive: true,
      isVerified: true,
      stripeConnectedAccountId: { $exists: true, $ne: null }
    }).populate('user');
    
    logger.info(`Processing daily payouts for ${professionals.length} professionals`);
    
    for (const professional of professionals) {
      await processPayout(professional);
    }
  } catch (error) {
    logger.error(`Error in daily payout processing: ${error.message}`);
  }
}

/**
 * Process payout for a professional
 * @param {Object} professional - Professional profile document
 */
async function processPayout(professional) {
  try {
    // Check if professional has a Stripe connected account
    if (!professional.stripeConnectedAccountId) {
      logger.warn(`Professional ${professional._id} does not have a Stripe connected account`);
      return;
    }
    
    // Get unpaid completed sessions
    const completedSessions = await Session.find({
      professional: professional._id,
      status: 'completed',
      paymentStatus: 'paid',
      zoomMeetingVerified: true
    });
    
    // Get unpaid verified referrals
    const verifiedReferrals = await Referral.find({
      professional: professional._id,
      status: 'verified',
      emailDomainVerified: true,
      paymentStatus: 'pending'
    });
    
    // Calculate total payout amount
    const sessionAmount = completedSessions.reduce((sum, session) => {
      // Apply platform fee (e.g., 15%)
      const platformFeePercent = process.env.PLATFORM_FEE_PERCENT || 15;
      const platformFee = session.price * (platformFeePercent / 100);
      const professionalAmount = session.price - platformFee;
      return sum + professionalAmount;
    }, 0);
    
    const referralAmount = verifiedReferrals.reduce((sum, referral) => {
      return sum + (process.env.REFERRAL_REWARD_AMOUNT || 50);
    }, 0);
    
    const totalAmount = sessionAmount + referralAmount;
    
    // Skip if amount is below threshold (default $1)
    const minPayout = process.env.MIN_PAYOUT_AMOUNT || 1;
    if (totalAmount < minPayout) {
      logger.info(`Skipping payout for professional ${professional._id} - amount ${totalAmount} below minimum ${minPayout}`);
      return;
    }
    
    // Process payout through Stripe
    const payout = await stripe.transfers.create({
      amount: Math.round(totalAmount * 100), // convert to cents
      currency: 'usd',
      destination: professional.stripeConnectedAccountId,
      description: `Payout for ${completedSessions.length} sessions and ${verifiedReferrals.length} referrals`
    }, {
      idempotencyKey: `payout-${professional._id.toString()}-${Date.now()}`
    });
    
    // Update session payment status
    for (const session of completedSessions) {
      session.paymentStatus = 'released';
      await session.save();
      
      // Create payment record
      await Payment.create({
        user: null, // System-initiated payout
        recipient: professional.user._id,
        amount: session.price * (1 - (process.env.PLATFORM_FEE_PERCENT || 15) / 100),
        currency: 'usd',
        description: `Payout for session ${session._id}`,
        type: 'payout',
        status: 'completed',
        stripeTransferId: payout.id,
        session: session._id,
        platformFee: {
          amount: session.price * ((process.env.PLATFORM_FEE_PERCENT || 15) / 100),
          percentage: process.env.PLATFORM_FEE_PERCENT || 15
        },
        completedAt: new Date()
      });
    }
    
    // Update referral status
    for (const referral of verifiedReferrals) {
      referral.status = 'rewarded';
      referral.paymentStatus = 'paid';
      referral.paymentId = payout.id;
      referral.rewardAmount = process.env.REFERRAL_REWARD_AMOUNT || 50;
      referral.payoutDate = new Date();
      await referral.save();
      
      // Create payment record
      await Payment.create({
        user: null, // System-initiated payout
        recipient: professional.user._id,
        amount: process.env.REFERRAL_REWARD_AMOUNT || 50,
        currency: 'usd',
        description: `Payout for referral ${referral._id}`,
        type: 'payout',
        status: 'completed',
        stripeTransferId: payout.id,
        referral: referral._id,
        completedAt: new Date()
      });
    }
    
    // Update professional statistics
    professional.statistics.totalEarnings += totalAmount;
    professional.statistics.successfulReferrals += verifiedReferrals.length;
    await professional.save();
    
    // Send notification
    await NotificationService.sendNotification(professional.user._id, 'payoutProcessed', {
      amount: totalAmount,
      sessions: completedSessions.length,
      referrals: verifiedReferrals.length
    });
    
    // Send email notification
    await EmailService.sendPayoutNotification({
      _id: payout.id,
      amount: totalAmount,
      currency: 'usd',
      createdAt: new Date(),
      destination: {
        last4: professional.stripeConnectedAccountId.slice(-4)
      },
      arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Estimated arrival in 2 days
    }, professional);
    
    logger.info(`Processed payout for professional ${professional._id}: $${totalAmount} for ${completedSessions.length} sessions and ${verifiedReferrals.length} referrals`);
    
    return payout;
  } catch (error) {
    logger.error(`Error processing payout for professional ${professional._id}: ${error.message}`);
    throw error;
  }
}

module.exports = payoutJob;