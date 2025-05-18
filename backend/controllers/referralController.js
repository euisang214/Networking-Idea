/**
 * Referral controller
 */
const { validationResult } = require('express-validator');
const ReferralModel = require('../models/referral');
const UserModel = require('../models/user');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errorTypes');

/**
 * Create a new referral (invite a friend)
 */
exports.createReferral = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    const { email, message } = req.body;
    const referrerId = req.user.id;

    // Check if email already exists as a user
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new BadRequestError('This email is already registered with us');
    }

    // Check if email already has a pending invitation
    const existingReferral = await ReferralModel.findByEmail(email);
    if (existingReferral && existingReferral.status === 'invited') {
      throw new BadRequestError('This email already has a pending invitation');
    }

    // Get referrer details
    const referrer = await UserModel.findById(referrerId);

    // Create referral
    const referral = await ReferralModel.create({
      referrer_id: referrerId,
      email: email,
      status: 'invited'
    });

    // Get referral link
    const { referralCode, referralLink } = await ReferralModel.getReferralLink(
      referrerId,
      process.env.FRONTEND_URL
    );

    // Send invitation email
    await emailService.sendReferralInvitation(email, {
      referrerName: `${referrer.first_name} ${referrer.last_name}`,
      referralLink: referralLink,
      message: message || ''
    });

    // Return the created referral
    res.status(201).json({
      message: 'Invitation sent successfully',
      referral: {
        ...referral,
        referralCode,
        referralLink
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all referrals for the current user
 */
exports.getUserReferrals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, status } = req.query;

    // Get referrals for the user
    const referralsData = await ReferralModel.listForUser(userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      status,
      includeUsers: true
    });

    // Return referrals
    res.status(200).json(referralsData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral statistics for the current user
 */
exports.getReferralStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get referral statistics
    const stats = await ReferralModel.getStatistics(userId);

    // Return statistics
    res.status(200).json({
      statistics: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referral link for the current user
 */
exports.getReferralLink = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get or create referral link
    const referralData = await ReferralModel.getReferralLink(
      userId,
      process.env.FRONTEND_URL
    );

    // Return referral link data
    res.status(200).json(referralData);
  } catch (error) {
    next(error);
  }
};

/**
 * Re-send invitation
 */
exports.resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the referral
    const referral = await ReferralModel.findById(id);
    
    if (!referral) {
      throw new NotFoundError('Referral not found');
    }

    // Check if user is authorized to resend this invitation
    if (referral.referrer_id !== userId) {
      throw new ForbiddenError('You are not authorized to resend this invitation');
    }

    // Check if referral is still in invited status
    if (referral.status !== 'invited') {
      throw new BadRequestError(`Cannot resend invitation for referral with status ${referral.status}`);
    }

    // Get referrer details
    const referrer = await UserModel.findById(userId);

    // Get referral link
    const { referralLink } = await ReferralModel.getReferralLink(
      userId,
      process.env.FRONTEND_URL
    );

    // Send invitation email
    await emailService.sendReferralInvitation(referral.email, {
      referrerName: `${referrer.first_name} ${referrer.last_name}`,
      referralLink: referralLink,
      message: req.body.message || ''
    });

    // Return success
    res.status(200).json({
      message: 'Invitation resent successfully',
      referral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel invitation
 */
exports.cancelInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the referral
    const referral = await ReferralModel.findById(id);
    
    if (!referral) {
      throw new NotFoundError('Referral not found');
    }

    // Check if user is authorized to cancel this invitation
    if (referral.referrer_id !== userId) {
      throw new ForbiddenError('You are not authorized to cancel this invitation');
    }

    // Check if referral is still in invited status
    if (referral.status !== 'invited') {
      throw new BadRequestError(`Cannot cancel invitation for referral with status ${referral.status}`);
    }

    // Delete the referral
    await ReferralModel.delete(id);

    // Return success
    res.status(200).json({
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a referral completion when a referred user completes their first session
 * @param {string} userId - Referred user ID
 * @returns {Object|null} Updated referral object or null if not found
 */
exports.processReferralCompletion = async (userId) => {
  try {
    // Check if user was referred
    const referral = await ReferralModel.findByReferredId(userId);
    
    if (!referral || referral.status === 'completed') {
      return null;
    }

    // Default reward amount (could be configured dynamically)
    const rewardAmount = 10; // $10 reward

    // Mark referral as completed
    const updatedReferral = await ReferralModel.markAsCompleted(userId, rewardAmount);
    
    if (!updatedReferral) {
      return null;
    }

    // Get referrer and referred user details
    const referrer = await UserModel.findById(updatedReferral.referrer_id);
    const referredUser = await UserModel.findById(userId);

    // Send notification to referrer
    await notificationService.createNotification({
      userId: referrer.id,
      title: 'Referral Reward Earned',
      content: `You've earned a ${rewardAmount} reward for referring ${referredUser.first_name} ${referredUser.last_name}`,
      type: 'referral'
    });

    // Send email to referrer
    await emailService.sendReferralCompleted(referrer.email, {
      firstName: referrer.first_name,
      referredName: `${referredUser.first_name} ${referredUser.last_name}`,
      rewardAmount: `$${rewardAmount}`
    });

    return updatedReferral;
  } catch (error) {
    logger.error('Failed to process referral completion:', error);
    return null;
  }
};

/**
 * Admin: Mark a referral reward as paid
 */
exports.markReferralAsPaid = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can mark referrals as paid');
    }

    // Mark referral as paid
    const updatedReferral = await ReferralModel.markAsPaid(id);

    // Get referrer details
    const referrer = await UserModel.findById(updatedReferral.referrer_id);

    // Send notification to referrer
    await notificationService.createNotification({
      userId: referrer.id,
      title: 'Referral Reward Paid',
      content: `Your $${updatedReferral.reward_amount} referral reward has been paid`,
      type: 'referral'
    });

    // Return updated referral
    res.status(200).json({
      message: 'Referral marked as paid successfully',
      referral: updatedReferral
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate referral code during registration
 */
exports.validateReferralCode = async (req, res, next) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(200).json({
        valid: false,
        message: 'No referral code provided'
      });
    }

    // Extract user ID from referral code
    const code = referralCode.toUpperCase();
    if (!code.startsWith('REF-') || code.length !== 12) {
      return res.status(200).json({
        valid: false,
        message: 'Invalid referral code format'
      });
    }

    const hash = code.replace('REF-', '').toLowerCase();
    try {
      const referrerId = Buffer.from(hash, 'base64').toString('utf8');
      
      // Check if the referrer exists
      const referrer = await UserModel.findById(referrerId);
      
      if (!referrer) {
        return res.status(200).json({
          valid: false,
          message: 'Invalid referral code'
        });
      }

      return res.status(200).json({
        valid: true,
        referrerName: `${referrer.first_name} ${referrer.last_name}`,
        message: 'Valid referral code'
      });
    } catch (error) {
      return res.status(200).json({
        valid: false,
        message: 'Invalid referral code'
      });
    }
  } catch (error) {
    next(error);
  }
};
