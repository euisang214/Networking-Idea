const Referral = require('../models/referral');
const User = require('../models/user');
const ProfessionalProfile = require('../models/professionalProfile');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');
const PaymentService = require('./paymentService');
const logger = require('../utils/logger');

class ReferralService {
  // Create a new referral record from parsed email
  async createReferralFromEmail(emailDetails) {
    try {
      // Validate email contains required information
      if (!emailDetails || !emailDetails.senderEmail || !emailDetails.recipientEmail) {
        throw new Error('Invalid email details');
      }
      
      // Check if platform was CC'd
      if (!emailDetails.isPlatformCCd) {
        logger.info(`Platform not CC'd in email from ${emailDetails.senderEmail}`);
        return null;
      }
      
      // Find professional based on sender email
      const professionalUser = await User.findOne({ 
        email: emailDetails.senderEmail.toLowerCase(),
        userType: 'professional'
      });
      
      if (!professionalUser) {
        logger.info(`No professional found with email ${emailDetails.senderEmail}`);
        return null;
      }
      
      const professional = await ProfessionalProfile.findOne({
        user: professionalUser._id
      });
      
      if (!professional) {
        logger.info(`No professional profile found for user ${professionalUser._id}`);
        return null;
      }
      
      // Try to find candidate in email content
      const candidate = await User.findCandidateInEmailContent(emailDetails.body);
      
      if (!candidate) {
        logger.info(`No candidate found in email content from ${emailDetails.senderEmail}`);
        return null;
      }
      
      // Check if referral already exists
      const existingReferral = await Referral.findOne({
        professional: professional._id,
        candidate: candidate._id,
        'emailDetails.referralEmailId': emailDetails.referralEmailId
      });
      
      if (existingReferral) {
        logger.info(`Referral already exists: ${existingReferral._id}`);
        return existingReferral;
      }
      
      // Create new referral
      const referral = new Referral({
        professional: professional._id,
        candidate: candidate._id,
        referralType: 'email',
        status: 'pending',
        emailDetails: {
          senderEmail: emailDetails.senderEmail,
          senderDomain: emailDetails.senderDomain,
          recipientEmail: emailDetails.recipientEmail,
          recipientDomain: emailDetails.recipientDomain,
          ccEmails: emailDetails.ccEmails,
          subject: emailDetails.subject,
          referralEmailId: emailDetails.referralEmailId,
          timestamp: emailDetails.timestamp
        },
        emailDomainVerified: emailDetails.domainsMatch
      });
      
      await referral.save();
      
      // If domains match, verify referral
      if (emailDetails.domainsMatch) {
        await this.verifyReferral(referral._id);
      }
      
      logger.info(`Referral created: ${referral._id} from professional ${professional._id} for candidate ${candidate._id}`);
      
      return referral;
    } catch (error) {
      logger.error(`Failed to create referral from email: ${error.message}`);
      throw new Error(`Failed to create referral from email: ${error.message}`);
    }
  }

  // Manually create a referral
  async createReferral(professionalId, candidateEmail, referralType = 'link') {
    try {
      const professional = await ProfessionalProfile.findById(professionalId);
      if (!professional) {
        throw new Error('Professional not found');
      }
      
      const candidate = await User.findOne({ 
        email: candidateEmail.toLowerCase(),
        userType: 'candidate'
      });
      
      if (!candidate) {
        throw new Error('Candidate not found');
      }
      
      // Check if referral already exists
      const existingReferral = await Referral.findOne({
        professional: professionalId,
        candidate: candidate._id
      });
      
      if (existingReferral) {
        return existingReferral;
      }
      
      const referral = new Referral({
        professional: professionalId,
        candidate: candidate._id,
        referralType,
        status: 'pending'
      });
      
      await referral.save();
      
      // Send notification to candidate
      await NotificationService.sendNotification(candidate._id, 'referralReceived', {
        referralId: referral._id,
        professionalName: professional.anonymizedProfile.displayName
      });
      
      logger.info(`Referral created: ${referral._id} from professional ${professionalId} for candidate ${candidate._id}`);
      
      return referral;
    } catch (error) {
      logger.error(`Failed to create referral: ${error.message}`);
      throw new Error(`Failed to create referral: ${error.message}`);
    }
  }

  // Get referral by ID
  async getReferralById(referralId) {
    try {
      const referral = await Referral.findById(referralId)
                                    .populate('professional')
                                    .populate('candidate', '-password');
      
      if (!referral) {
        throw new Error('Referral not found');
      }
      
      return referral;
    } catch (error) {
      logger.error(`Failed to get referral: ${error.message}`);
      throw new Error(`Failed to get referral: ${error.message}`);
    }
  }

  // Get all referrals for a professional
  async getProfessionalReferrals(professionalId) {
    try {
      return await Referral.find({ professional: professionalId })
                          .populate('candidate', '-password')
                          .sort({ createdAt: -1 })
                          .exec();
    } catch (error) {
      logger.error(`Failed to get professional referrals: ${error.message}`);
      throw new Error(`Failed to get professional referrals: ${error.message}`);
    }
  }

  // Get all referrals for a candidate
  async getCandidateReferrals(candidateId) {
    try {
      return await Referral.find({ candidate: candidateId })
                          .populate('professional')
                          .sort({ createdAt: -1 })
                          .exec();
    } catch (error) {
      logger.error(`Failed to get candidate referrals: ${error.message}`);
      throw new Error(`Failed to get candidate referrals: ${error.message}`);
    }
  }

  // Verify a referral (confirm domain match or other verification)
  async verifyReferral(referralId) {
    try {
      const referral = await Referral.findById(referralId);
      
      if (!referral) {
        throw new Error('Referral not found');
      }
      
      // If this is an email referral, verify domains match
      if (referral.referralType === 'email') {
        if (!referral.emailDetails || 
            !referral.emailDetails.senderDomain || 
            !referral.emailDetails.recipientDomain) {
          throw new Error('Insufficient email details for verification');
        }
        
        if (referral.emailDetails.senderDomain !== referral.emailDetails.recipientDomain) {
          throw new Error('Email domains do not match');
        }
        
        referral.emailDomainVerified = true;
      }
      
      referral.status = 'verified';
      referral.verificationDetails = {
        verifiedAt: new Date(),
        verificationMethod: referral.referralType === 'email' ? 'domain-match' : 'manual',
        verifiedBy: null // System verification
      };
      
      await referral.save();
      
      // Send notifications
      await NotificationService.sendNotification(referral.professional, 'referralVerified', {
        referralId: referral._id
      });
      
      logger.info(`Referral ${referralId} verified`);
      
      // Process reward payment
      await PaymentService.processReferralPayment(referralId);
      
      return referral;
    } catch (error) {
      logger.error(`Failed to verify referral: ${error.message}`);
      throw new Error(`Failed to verify referral: ${error.message}`);
    }
  }

  // Create verified referral directly (for testing or manual operations)
  async createVerifiedReferral(professionalId, candidateId) {
    try {
      const professional = await ProfessionalProfile.findById(professionalId);
      if (!professional) {
        throw new Error('Professional not found');
      }
      
      const candidate = await User.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }
      
      const referral = new Referral({
        professional: professionalId,
        candidate: candidateId,
        referralType: 'email',
        status: 'verified',
        emailDomainVerified: true,
        verificationDetails: {
          verifiedAt: new Date(),
          verificationMethod: 'manual',
          verifiedBy: null
        }
      });
      
      await referral.save();
      
      logger.info(`Verified referral created: ${referral._id}`);
      
      return referral;
    } catch (error) {
      logger.error(`Failed to create verified referral: ${error.message}`);
      throw new Error(`Failed to create verified referral: ${error.message}`);
    }
  }
}

module.exports = new ReferralService(); 