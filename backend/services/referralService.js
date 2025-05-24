const Referral = require('../models/referral');
const ProfessionalProfile = require('../models/professionalProfile');
const PaymentService = require('./paymentService');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');

class ReferralService {
  async createReferral(data) {
    const referral = new Referral(data);
    await referral.save();
    return referral;
  }

  async getReferralById(id) {
    return Referral.findById(id);
  }

  async getProfessionalReferrals(professionalId) {
    return Referral.find({ professional: professionalId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getCandidateReferrals(userId) {
    return Referral.find({ candidate: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async checkPayoutEligibility(referral) {
    const MAX_REWARD_PER_PRO = parseInt(process.env.MAX_REWARD_PER_PRO || '5', 10);
    const COOLDOWN_DAYS = parseInt(process.env.COOLDOWN_DAYS || '7', 10);

    if (MAX_REWARD_PER_PRO > 0) {
      const rewardedCount = await Referral.countDocuments({
        professional: referral.professional,
        status: 'rewarded',
      });
      if (rewardedCount >= MAX_REWARD_PER_PRO) {
        return { eligible: false, reason: 'Maximum referral limit reached' };
      }
    }

    if (COOLDOWN_DAYS > 0) {
      const lastReward = await Referral.findOne({
        professional: referral.professional,
        status: 'rewarded',
      }).sort({ payoutDate: -1 });

      if (lastReward && lastReward.payoutDate) {
        const daysSince = (Date.now() - lastReward.payoutDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) {
          return {
            eligible: false,
            reason: `Cooldown period active (${COOLDOWN_DAYS - Math.floor(daysSince)} days remaining)`,
          };
        }
      }
    }

    return { eligible: true };
  }

  async verifyReferral(referralId) {
    try {
      const referral = await this.getReferralById(referralId);
      if (!referral) {
        throw new Error('Referral not found');
      }

      const eligibility = await this.checkPayoutEligibility(referral);
      if (!eligibility.eligible) {
        referral.status = 'rejected';
        await referral.save();
        return { status: 'rejected', reason: eligibility.reason };
      }

      referral.status = 'verified';
      referral.emailDomainVerified = true;
      referral.verificationDetails = {
        verifiedAt: new Date(),
        verificationMethod: 'manual',
        verifiedBy: null,
      };
      await referral.save();

      const payout = await PaymentService.processReferralPayment(referral._id);
      referral.status = 'rewarded';
      referral.paymentId = payout.transferId;
      referral.paymentStatus = 'paid';
      referral.payoutDate = new Date();
      await referral.save();

      if (referral.professional && referral.professional.user) {
        await NotificationService.sendNotification(referral.professional.user, 'referralRewarded', {
          referralId: referral._id,
          amount: payout.amount,
          candidateEmail: referral.candidate?.email,
        });
      }

      return { status: 'rewarded', transferId: payout.transferId };
    } catch (error) {
      logger.error(`Failed to verify referral: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReferralService();
