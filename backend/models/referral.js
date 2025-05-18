/**
 * Referral model
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../utils/errorTypes');

class Referral {
  /**
   * Create a new referral
   * @param {Object} referralData - Referral data
   * @returns {Object} Created referral object
   */
  static async create(referralData) {
    // Generate a UUID if not provided
    const id = referralData.id || uuidv4();
    
    // Insert the referral into the database
    const [referral] = await db('referrals')
      .insert({
        id,
        referrer_id: referralData.referrer_id,
        referred_id: referralData.referred_id,
        email: referralData.email.toLowerCase(),
        status: referralData.status || 'invited',
        reward_amount: referralData.reward_amount || 0,
        is_paid: referralData.is_paid || false
      })
      .returning('*');
    
    return referral;
  }

  /**
   * Find a referral by ID
   * @param {string} id - Referral ID
   * @returns {Object|null} Referral object or null if not found
   */
  static async findById(id) {
    const referral = await db('referrals')
      .where({ id })
      .first();
    
    return referral || null;
  }

  /**
   * Find a referral by email
   * @param {string} email - Email address
   * @returns {Object|null} Referral object or null if not found
   */
  static async findByEmail(email) {
    const referral = await db('referrals')
      .where({ email: email.toLowerCase() })
      .orderBy('created_at', 'desc')
      .first();
    
    return referral || null;
  }

  /**
   * Find a referral by referred user ID
   * @param {string} referredId - Referred user ID
   * @returns {Object|null} Referral object or null if not found
   */
  static async findByReferredId(referredId) {
    const referral = await db('referrals')
      .where({ referred_id: referredId })
      .first();
    
    return referral || null;
  }

  /**
   * Update a referral
   * @param {string} id - Referral ID
   * @param {Object} referralData - Referral data to update
   * @returns {Object} Updated referral object
   */
  static async update(id, referralData) {
    // Check if referral exists
    const existingReferral = await this.findById(id);
    
    if (!existingReferral) {
      throw new NotFoundError('Referral not found');
    }
    
    // Create update object
    const updateData = {};
    
    // Only include fields that are provided
    if (referralData.referred_id !== undefined) updateData.referred_id = referralData.referred_id;
    if (referralData.status !== undefined) updateData.status = referralData.status;
    if (referralData.reward_amount !== undefined) updateData.reward_amount = referralData.reward_amount;
    if (referralData.is_paid !== undefined) updateData.is_paid = referralData.is_paid;
    
    // Update the referral
    const [updatedReferral] = await db('referrals')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return updatedReferral;
  }

  /**
   * Delete a referral
   * @param {string} id - Referral ID
   * @returns {boolean} True if deleted, false if not found
   */
  static async delete(id) {
    const count = await db('referrals')
      .where({ id })
      .delete();
    
    return count > 0;
  }

  /**
   * List referrals for a user with pagination
   * @param {string} userId - User ID (referrer)
   * @param {Object} options - Pagination and filter options
   * @returns {Object} Object with referrals array and pagination info
   */
  static async listForUser(userId, {
    page = 1,
    limit = 20,
    status,
    includeUsers = false
  }) {
    // Start building the query
    let query = db('referrals').where({ referrer_id: userId });
    
    // Apply filters
    if (status) {
      query = query.where('status', status);
    }
    
    // Include user data if requested
    if (includeUsers) {
      query = query
        .select(
          'referrals.*',
          'referred_user.first_name as referred_first_name',
          'referred_user.last_name as referred_last_name',
          'referred_user.email as referred_email',
          'referred_user.created_at as referred_created_at'
        )
        .leftJoin('users as referred_user', 'referrals.referred_id', 'referred_user.id');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('created_at', 'desc').offset(offset).limit(limit);
    
    // Execute query
    const referrals = await query;
    
    // Get total count for pagination
    const [{ count }] = await db('referrals')
      .where({ referrer_id: userId })
      .modify(function(queryBuilder) {
        if (status) {
          queryBuilder.where('status', status);
        }
      })
      .count('id');
    
    return {
      referrals,
      pagination: {
        total: parseInt(count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(count, 10) / limit)
      }
    };
  }

  /**
   * Mark a referral as registered when the referred user creates an account
   * @param {string} email - Email address
   * @param {string} userId - Referred user ID
   * @returns {Object|null} Updated referral object or null if not found
   */
  static async markAsRegistered(email, userId) {
    const referral = await this.findByEmail(email);
    
    if (!referral) {
      return null;
    }
    
    // Update referral status and add referred user ID
    const [updatedReferral] = await db('referrals')
      .where({ id: referral.id })
      .update({
        status: 'registered',
        referred_id: userId
      })
      .returning('*');
    
    return updatedReferral;
  }

  /**
   * Mark a referral as completed when the referred user completes a session
   * @param {string} userId - Referred user ID
   * @param {number} rewardAmount - Reward amount
   * @returns {Object|null} Updated referral object or null if not found
   */
  static async markAsCompleted(userId, rewardAmount) {
    const referral = await this.findByReferredId(userId);
    
    if (!referral || referral.status === 'completed') {
      return null;
    }
    
    // Update referral status and add reward amount
    const [updatedReferral] = await db('referrals')
      .where({ id: referral.id })
      .update({
        status: 'completed',
        reward_amount: rewardAmount
      })
      .returning('*');
    
    return updatedReferral;
  }

  /**
   * Mark a referral reward as paid
   * @param {string} id - Referral ID
   * @returns {Object} Updated referral object
   */
  static async markAsPaid(id) {
    // Check if referral exists
    const existingReferral = await this.findById(id);
    
    if (!existingReferral) {
      throw new NotFoundError('Referral not found');
    }
    
    if (existingReferral.status !== 'completed') {
      throw new Error('Only completed referrals can be marked as paid');
    }
    
    if (existingReferral.is_paid) {
      return existingReferral; // Already paid
    }
    
    // Update the referral
    const [updatedReferral] = await db('referrals')
      .where({ id })
      .update({
        is_paid: true
      })
      .returning('*');
    
    return updatedReferral;
  }

  /**
   * Get referral statistics for a user
   * @param {string} userId - User ID (referrer)
   * @returns {Object} Referral statistics
   */
  static async getStatistics(userId) {
    // Get total referrals by status
    const statusCounts = await db('referrals')
      .where({ referrer_id: userId })
      .select('status')
      .count('id as count')
      .groupBy('status');
    
    // Convert to object with status as key
    const statusCountsObj = statusCounts.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count, 10);
      return acc;
    }, {});
    
    // Get total reward amount
    const [{ total_reward }] = await db('referrals')
      .where({ referrer_id: userId, status: 'completed' })
      .sum('reward_amount as total_reward');
    
    // Get total paid amount
    const [{ total_paid }] = await db('referrals')
      .where({ referrer_id: userId, status: 'completed', is_paid: true })
      .sum('reward_amount as total_paid');
    
    return {
      total: {
        invited: statusCountsObj.invited || 0,
        registered: statusCountsObj.registered || 0,
        completed: statusCountsObj.completed || 0,
        all: Object.values(statusCountsObj).reduce((a, b) => a + b, 0)
      },
      rewards: {
        total: parseFloat(total_reward || 0),
        paid: parseFloat(total_paid || 0),
        pending: parseFloat((total_reward || 0) - (total_paid || 0))
      }
    };
  }

  /**
   * Generate a unique referral code for a user
   * @param {string} userId - User ID
   * @returns {string} Referral code
   */
  static generateReferralCode(userId) {
    // Generate a hash-based code from the user ID
    const hash = Buffer.from(userId).toString('base64').substr(0, 8);
    return `REF-${hash}`.toUpperCase();
  }

  /**
   * Get or create a referral link for a user
   * @param {string} userId - User ID
   * @param {string} baseUrl - Base URL for referral link
   * @returns {Object} Referral link data
   */
  static async getReferralLink(userId, baseUrl) {
    // Generate referral code
    const referralCode = this.generateReferralCode(userId);
    
    // Create referral link
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;
    
    return {
      userId,
      referralCode,
      referralLink
    };
  }

  /**
   * Process a user registration with referral code
   * @param {string} referralCode - Referral code
   * @param {string} email - New user email
   * @param {string} userId - New user ID
   * @returns {Object|null} Updated referral object or null if not found
   */
  static async processRegistrationWithReferral(referralCode, email, userId) {
    if (!referralCode) {
      return null;
    }
    
    // Extract user ID from referral code
    const hash = referralCode.replace('REF-', '').toLowerCase();
    const referrerId = Buffer.from(hash, 'base64').toString('utf8');
    
    // Check if the referrer exists
    const referrer = await db('users').where({ id: referrerId }).first();
    
    if (!referrer) {
      return null;
    }
    
    // Check if the email already has a referral
    const existingReferral = await this.findByEmail(email);
    
    if (existingReferral) {
      // Update the existing referral
      return await this.markAsRegistered(email, userId);
    }
    
    // Create a new referral
    const referral = await this.create({
      referrer_id: referrerId,
      referred_id: userId,
      email,
      status: 'registered'
    });
    
    return referral;
  }
}

module.exports = Referral;
