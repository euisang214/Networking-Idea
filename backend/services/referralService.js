const Referral = require('../models/referral');
const ProfessionalProfile = require('../models/professionalProfile');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');
const config = require('../config');

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
    const MAX_REWARD_PER_PRO = parseInt(config.business.maxRewardPerPro, 10);
    const COOLDOWN_DAYS = parseInt(config.business.cooldownDays, 10);

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

      referral.status = 'verified';
      referral.emailDomainVerified = true;
      referral.verificationDetails = {
        verifiedAt: new Date(),
        verificationMethod: 'manual',
        verifiedBy: null,
      };
      await referral.save();

      if (referral.professional && referral.professional.user) {
        await NotificationService.sendNotification(referral.professional.user, 'referralVerified', {
          referralId: referral._id,
          candidateEmail: referral.candidate?.email,
        });
      }

      return { status: 'verified' };
    } catch (error) {
      logger.error(`Failed to verify referral: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReferralService();
