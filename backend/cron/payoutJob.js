const cron = require('node-cron');
const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);
const ProfessionalProfile = require('../models/professionalProfile');
const Session = require('../models/session');
const Payment = require('../models/payment');
const EmailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Payout processing job
 * Processes payouts for professionals based on their settings
 * Runs every minute for near real-time payouts
 */
const payoutJob = cron.schedule('*/1 * * * *', async () => {
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
    
    // Calculate total payout amount
    const sessionAmount = completedSessions.reduce((sum, session) => {
      // Apply platform fee (e.g., 15%)
      const platformFeePercent = config.business.platformFeePercent;
      const platformFee = session.price * (platformFeePercent / 100);
      const professionalAmount = session.price - platformFee;
      return sum + professionalAmount;
    }, 0);
    const totalAmount = sessionAmount;
    
    // Skip if amount is below threshold (default $1)
    const minPayout = config.business.minPayoutAmount;
    if (totalAmount < minPayout) {
      logger.info(`Skipping payout for professional ${professional._id} - amount ${totalAmount} below minimum ${minPayout}`);
      return;
    }
    
    // Process payout through Stripe
    const payout = await stripe.transfers.create({
      amount: Math.round(totalAmount * 100), // convert to cents
      currency: 'usd',
      destination: professional.stripeConnectedAccountId,
      description: `Payout for ${completedSessions.length} sessions`
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
        amount: session.price * (1 - (config.business.platformFeePercent) / 100),
        currency: 'usd',
        description: `Payout for session ${session._id}`,
        type: 'payout',
        status: 'completed',
        stripeTransferId: payout.id,
        session: session._id,
        platformFee: {
          amount: session.price * ((config.business.platformFeePercent) / 100),
          percentage: config.business.platformFeePercent
        },
        completedAt: new Date()
      });
    }
    
    // Update professional statistics
    professional.statistics.totalEarnings += totalAmount;
    await professional.save();

    // Send notification
    await NotificationService.sendNotification(professional.user._id, 'payoutProcessed', {
      amount: totalAmount,
      sessions: completedSessions.length
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
    
    logger.info(`Processed payout for professional ${professional._id}: $${totalAmount} for ${completedSessions.length} sessions`);
    
    return payout;
  } catch (error) {
    logger.error(`Error processing payout for professional ${professional._id}: ${error.message}`);
    throw error;
  }
}

module.exports = payoutJob;