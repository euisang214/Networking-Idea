const ReferralService = require('./referralService');
const PaymentService = require('./paymentService');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');

class referralService extends ReferralService {
  
  // Enhanced email processing with automatic payout
  async processReferralEmail(emailData) {
    try {
      logger.info('Processing referral email for automatic verification');
      
      // Parse email data using existing method
      const parsedEmail = EmailService.parseReferralEmail(emailData);
      
      if (!parsedEmail || !parsedEmail.isPlatformCCd) {
        logger.info('Email not eligible for referral processing');
        return { success: false, reason: 'Platform not CC\'d or invalid email' };
      }
      
      // Create referral record
      const referral = await this.createReferralFromEmail(parsedEmail);
      
      if (!referral) {
        return { success: false, reason: 'Could not create referral' };
      }
      
      // CRITICAL: Auto-verify if domains match
      if (parsedEmail.domainsMatch) {
        await this.verifyAndPayReferral(referral._id);
        return {
          success: true,
          referralId: referral._id,
          verified: true,
          payoutProcessed: true
        };
      }
      
      return {
        success: true,
        referralId: referral._id,
        verified: false,
        reason: 'Domain mismatch - manual review required'
      };
      
    } catch (error) {
      logger.error(`Error processing referral email: ${error.message}`);
      throw error;
    }
  }
  
  // New method: Verify referral and process payout in one step
  async verifyAndPayReferral(referralId) {
    try {
      const referral = await this.getReferralById(referralId);
      
      if (!referral) {
        throw new Error('Referral not found');
      }
      
      // Verify email domains match
      if (!this.validateEmailDomains(referral)) {
        throw new Error('Email domains do not match');
      }
      
      // Check business rules before payout
      const canPayout = await this.checkPayoutEligibility(referral);
      if (!canPayout.eligible) {
        logger.info(`Referral ${referralId} not eligible for payout: ${canPayout.reason}`);
        referral.status = 'verified'; // Verified but not paid
        await referral.save();
        return { verified: true, paid: false, reason: canPayout.reason };
      }
      
      // Mark as verified
      referral.status = 'verified';
      referral.emailDomainVerified = true;
      referral.verificationDetails = {
        verifiedAt: new Date(),
        verificationMethod: 'automatic-domain-match',
        verifiedBy: null
      };
      await referral.save();
      
      // Process payout automatically
      try {
        const payoutResult = await PaymentService.processReferralPayment(referralId);
        
        // Send notifications
        await NotificationService.sendNotification(referral.professional.user, 'referralRewarded', {
          referralId: referral._id,
          amount: payoutResult.amount,
          candidateEmail: referral.candidate.email
        });
        
        logger.info(`Referral ${referralId} verified and payout processed: $${payoutResult.amount}`);
        
        return {
          verified: true,
          paid: true,
          amount: payoutResult.amount,
          transferId: payoutResult.transferId
        };
        
      } catch (payoutError) {
        logger.error(`Payout failed for referral ${referralId}: ${payoutError.message}`);
        return {
          verified: true,
          paid: false,
          reason: 'Payout processing failed - will retry'
        };
      }
      
    } catch (error) {
      logger.error(`Error in verifyAndPayReferral: ${error.message}`);
      throw error;
    }
  }
  
  // Check if referral is eligible for payout based on business rules
  async checkPayoutEligibility(referral) {
    const MAX_REWARD_PER_PRO = parseInt(process.env.MAX_REWARD_PER_PRO || '5', 10);
    const COOLDOWN_DAYS = parseInt(process.env.COOLDOWN_DAYS || '7', 10);
    
    // Check maximum rewards per professional
    if (MAX_REWARD_PER_PRO > 0) {
      const rewardedCount = await Referral.countDocuments({
        professional: referral.professional,
        status: 'rewarded'
      });
      
      if (rewardedCount >= MAX_REWARD_PER_PRO) {
        return { eligible: false, reason: 'Maximum referral limit reached' };
      }
    }
    
    // Check cooldown period
    if (COOLDOWN_DAYS > 0) {
      const lastReward = await Referral.findOne({
        professional: referral.professional,
        status: 'rewarded'
      }).sort({ payoutDate: -1 });
      
      if (lastReward && lastReward.payoutDate) {
        const daysSinceLastReward = (Date.now() - lastReward.payoutDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastReward < COOLDOWN_DAYS) {
          return { eligible: false, reason: `Cooldown period active (${COOLDOWN_DAYS - Math.floor(daysSinceLastReward)} days remaining)` };
        }
      }
    }
    
    return { eligible: true };
  }
  
  // Validate email domains match
  validateEmailDomains(referral) {
    if (!referral.emailDetails || 
        !referral.emailDetails.senderDomain || 
        !referral.emailDetails.recipientDomain) {
      return false;
    }
    
    return referral.emailDetails.senderDomain.toLowerCase() === 
           referral.emailDetails.recipientDomain.toLowerCase();
  }
}

module.exports = new EnhancedReferralService();