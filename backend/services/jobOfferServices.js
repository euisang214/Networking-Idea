const JobOffer = require('../models/jobOffer');
const Session = require('../models/session');
const User = require('../models/user');
const ProfessionalProfile = require('../models/professionalProfile');
const PaymentService = require('./paymentService');
const NotificationService = require('./notificationService');
const EmailService = require('./emailService');
const logger = require('../utils/logger');

class JobOfferService {
  async reportJobOffer({ sessionId, userId, reportedBy, offerDetails }) {
    try {
      const session = await Session.findById(sessionId)
        .populate('professional')
        .populate('user');

      if (!session) {
        throw new Error('Session not found');
      }

      // Verify user is part of this session
      const isCandidate = session.user._id.toString() === userId;
      const isProfessional = session.professional.user.toString() === userId;

      if (!isCandidate && !isProfessional) {
        throw new Error('Unauthorized to report offer for this session');
      }

      // Check if offer already exists for this candidate/company combination
      const existingOffer = await JobOffer.findOne({
        candidate: session.user._id,
        company: session.professional.company
      });

      if (existingOffer) {
        throw new Error('Job offer already reported for this company');
      }

      const jobOffer = new JobOffer({
        candidate: session.user._id,
        professional: session.professional._id,
        company: session.professional.company,
        session: sessionId,
        reportedBy,
        offerBonusAmount: session.user.offerBonusAmount,
        offerDetails
      });

      await jobOffer.save();

      // Send notification to the other party for confirmation
      const otherUserId = reportedBy === 'candidate' 
        ? session.professional.user 
        : session.user._id;

      await NotificationService.sendNotification(otherUserId, 'jobOfferReported', {
        offerId: jobOffer._id,
        reportedBy,
        offerBonusAmount: jobOffer.offerBonusAmount
      });

      logger.info(`Job offer reported: ${jobOffer._id}`);
      return jobOffer;
    } catch (error) {
      logger.error(`Failed to report job offer: ${error.message}`);
      throw error;
    }
  }

  async confirmJobOffer(offerId, userId, confirmedBy) {
    try {
      const jobOffer = await JobOffer.findById(offerId)
        .populate('candidate')
        .populate('professional')
        .populate('session');

      if (!jobOffer) {
        throw new Error('Job offer not found');
      }

      // Verify user can confirm this offer
      const isCandidate = jobOffer.candidate._id.toString() === userId;
      const isProfessional = jobOffer.professional.user.toString() === userId;

      if (!isCandidate && !isProfessional) {
        throw new Error('Unauthorized to confirm this offer');
      }

      // Verify confirmedBy is different from reportedBy
      if (jobOffer.reportedBy === confirmedBy) {
        throw new Error('Cannot confirm your own report');
      }

      jobOffer.confirmedBy = confirmedBy;
      jobOffer.status = 'confirmed';
      jobOffer.confirmedAt = new Date();

      await jobOffer.save();

      // Process offer bonus payment
      await this.processOfferBonus(jobOffer._id);

      logger.info(`Job offer confirmed: ${jobOffer._id}`);
      return jobOffer;
    } catch (error) {
      logger.error(`Failed to confirm job offer: ${error.message}`);
      throw error;
    }
  }

  async processOfferBonus(offerId) {
    try {
      const jobOffer = await JobOffer.findById(offerId)
        .populate('candidate')
        .populate('professional')
        .populate('session');

      if (jobOffer.status !== 'confirmed') {
        throw new Error('Job offer not confirmed');
      }

      // Process payment through PaymentService
      const paymentResult = await PaymentService.processOfferBonus(jobOffer._id);

      jobOffer.status = 'paid';
      jobOffer.paymentId = paymentResult.transferId;
      jobOffer.paidAt = new Date();
      await jobOffer.save();

      // Send notifications
      await NotificationService.sendNotification(jobOffer.professional.user, 'offerBonusPaid', {
        amount: jobOffer.offerBonusAmount,
        candidateName: `${jobOffer.candidate.firstName} ${jobOffer.candidate.lastName}`
      });

      await NotificationService.sendNotification(jobOffer.candidate._id, 'offerBonusProcessed', {
        amount: jobOffer.offerBonusAmount,
        professionalName: `${jobOffer.professional.user.firstName} ${jobOffer.professional.user.lastName}`
      });

      return paymentResult;
    } catch (error) {
      logger.error(`Failed to process offer bonus: ${error.message}`);
      throw error;
    }
  }

  async getUserJobOffers(userId, userType) {
    try {
      let query = {};
      
      if (userType === 'candidate') {
        query.candidate = userId;
      } else if (userType === 'professional') {
        // Find professional profile first
        const professional = await ProfessionalProfile.findOne({ user: userId });
        if (professional) {
          query.professional = professional._id;
        }
      }

      return await JobOffer.find(query)
        .populate('candidate', 'firstName lastName email')
        .populate('professional', 'user title company')
        .populate('session', 'startTime endTime')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Failed to get user job offers: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new JobOfferService();