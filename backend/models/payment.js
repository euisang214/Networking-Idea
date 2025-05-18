/**
 * Payment model
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../utils/errorTypes');
const stripeService = require('../services/stripeService');
const logger = require('../utils/logger');

class Payment {
  /**
   * Create a payment record
   * @param {Object} paymentData - Payment data
   * @returns {Object} Created payment object
   */
  static async create(paymentData) {
    // Generate a UUID if not provided
    const id = paymentData.id || uuidv4();
    
    // Insert the payment into the database
    const [payment] = await db('payments')
      .insert({
        id,
        session_id: paymentData.session_id,
        user_id: paymentData.user_id,
        stripe_payment_id: paymentData.stripe_payment_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        status: paymentData.status || 'pending',
        paid_at: paymentData.paid_at
      })
      .returning('*');
    
    return payment;
  }

  /**
   * Find a payment by ID
   * @param {string} id - Payment ID
   * @returns {Object|null} Payment object or null if not found
   */
  static async findById(id) {
    const payment = await db('payments')
      .where({ id })
      .first();
    
    return payment || null;
  }

  /**
   * Find a payment by Stripe payment ID
   * @param {string} stripePaymentId - Stripe payment ID
   * @returns {Object|null} Payment object or null if not found
   */
  static async findByStripePaymentId(stripePaymentId) {
    const payment = await db('payments')
      .where({ stripe_payment_id: stripePaymentId })
      .first();
    
    return payment || null;
  }

  /**
   * Find a payment by session ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Payment object or null if not found
   */
  static async findBySessionId(sessionId) {
    const payment = await db('payments')
      .where({ session_id: sessionId })
      .first();
    
    return payment || null;
  }

  /**
   * Update a payment
   * @param {string} id - Payment ID
   * @param {Object} paymentData - Payment data to update
   * @returns {Object} Updated payment object
   */
  static async update(id, paymentData) {
    // Check if payment exists
    const existingPayment = await this.findById(id);
    
    if (!existingPayment) {
      throw new NotFoundError('Payment not found');
    }
    
    // Create update object
    const updateData = {};
    
    // Only include fields that are provided
    if (paymentData.status !== undefined) updateData.status = paymentData.status;
    if (paymentData.paid_at !== undefined) updateData.paid_at = paymentData.paid_at;
    
    // Update the payment
    const [updatedPayment] = await db('payments')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return updatedPayment;
  }

  /**
   * Complete a payment
   * @param {string} id - Payment ID
   * @returns {Object} Updated payment object
   */
  static async complete(id) {
    // Check if payment exists
    const existingPayment = await this.findById(id);
    
    if (!existingPayment) {
      throw new NotFoundError('Payment not found');
    }
    
    if (existingPayment.status === 'completed') {
      return existingPayment; // Already completed
    }
    
    // Update the payment
    const [updatedPayment] = await db('payments')
      .where({ id })
      .update({
        status: 'completed',
        paid_at: new Date()
      })
      .returning('*');
    
    return updatedPayment;
  }

  /**
   * Refund a payment
   * @param {string} id - Payment ID
   * @returns {Object} Updated payment object
   */
  static async refund(id) {
    // Check if payment exists
    const existingPayment = await this.findById(id);
    
    if (!existingPayment) {
      throw new NotFoundError('Payment not found');
    }
    
    if (existingPayment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }
    
    try {
      // Process refund through Stripe
      await stripeService.createRefund(existingPayment.stripe_payment_id);
      
      // Update the payment status
      const [updatedPayment] = await db('payments')
        .where({ id })
        .update({
          status: 'refunded'
        })
        .returning('*');
      
      return updatedPayment;
    } catch (error) {
      logger.error('Failed to process refund:', error);
      throw error;
    }
  }

  /**
   * Mark a payment as failed
   * @param {string} id - Payment ID
   * @param {string} reason - Failure reason
   * @returns {Object} Updated payment object
   */
  static async markAsFailed(id, reason) {
    // Check if payment exists
    const existingPayment = await this.findById(id);
    
    if (!existingPayment) {
      throw new NotFoundError('Payment not found');
    }
    
    // Update the payment
    const [updatedPayment] = await db('payments')
      .where({ id })
      .update({
        status: 'failed',
        feedback: reason
      })
      .returning('*');
    
    return updatedPayment;
  }

  /**
   * List payments for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Object} Object with payments array and pagination info
   */
  static async listForUser(userId, {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    includeSessions = false
  }) {
    // Start building the query
    let query = db('payments').where({ user_id: userId });
    
    // Apply filters
    if (status) {
      query = query.where('status', status);
    }
    
    if (startDate) {
      query = query.where('created_at', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('created_at', '<=', endDate);
    }
    
    // Include session data if requested
    if (includeSessions) {
      query = query
        .select(
          'payments.*',
          'sessions.scheduled_at',
          'sessions.duration_minutes',
          'sessions.status as session_status',
          'professional.first_name as professional_first_name',
          'professional.last_name as professional_last_name',
          'professional.is_anonymized as professional_is_anonymized',
          'professional_profiles.job_title'
        )
        .join('sessions', 'payments.session_id', 'sessions.id')
        .join('users as professional', 'sessions.professional_id', 'professional.id')
        .leftJoin('professional_profiles', 'professional.id', 'professional_profiles.user_id');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('created_at', 'desc').offset(offset).limit(limit);
    
    // Execute query
    const payments = await query;
    
    // Get total count for pagination
    const [{ count }] = await db('payments')
      .where({ user_id: userId })
      .modify(function(queryBuilder) {
        if (status) {
          queryBuilder.where('status', status);
        }
        
        if (startDate) {
          queryBuilder.where('created_at', '>=', startDate);
        }
        
        if (endDate) {
          queryBuilder.where('created_at', '<=', endDate);
        }
      })
      .count('id');
    
    return {
      payments,
      pagination: {
        total: parseInt(count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(count, 10) / limit)
      }
    };
  }

  /**
   * Get payment statistics for a user
   * @param {string} userId - User ID
   * @returns {Object} Payment statistics
   */
  static async getStatistics(userId) {
    // Get total earnings/payments
    const [totalResult] = await db('payments')
      .where({ user_id: userId, status: 'completed' })
      .sum('amount as total_amount')
      .count('id as total_count');
    
    // Get monthly earnings/payments for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await db('payments')
      .where({ user_id: userId, status: 'completed' })
      .where('created_at', '>=', sixMonthsAgo)
      .select(
        db.raw('DATE_TRUNC(\'month\', created_at) as month'),
        db.raw('SUM(amount) as monthly_amount'),
        db.raw('COUNT(id) as monthly_count')
      )
      .groupBy('month')
      .orderBy('month');
    
    // Get pending payments count and amount
    const [pendingResult] = await db('payments')
      .where({ user_id: userId, status: 'pending' })
      .sum('amount as pending_amount')
      .count('id as pending_count');
    
    return {
      total: {
        amount: parseFloat(totalResult.total_amount || 0),
        count: parseInt(totalResult.total_count || 0, 10)
      },
      monthly: monthlyData.map(item => ({
        month: item.month,
        amount: parseFloat(item.monthly_amount || 0),
        count: parseInt(item.monthly_count || 0, 10)
      })),
      pending: {
        amount: parseFloat(pendingResult.pending_amount || 0),
        count: parseInt(pendingResult.pending_count || 0, 10)
      }
    };
  }

  /**
   * Create a checkout session for a mentoring session
   * @param {Object} sessionData - Session data
   * @param {string} userId - User ID
   * @returns {Object} Checkout session data
   */
  static async createCheckoutSession(sessionData, userId) {
    try {
      // Get the session and professional profile
      const session = await db('sessions')
        .where('sessions.id', sessionData.sessionId)
        .join('professional_profiles', 'sessions.professional_id', 'professional_profiles.user_id')
        .select(
          'sessions.id',
          'sessions.seeker_id',
          'sessions.professional_id',
          'professional_profiles.hourly_rate'
        )
        .first();
      
      if (!session) {
        throw new NotFoundError('Session not found');
      }
      
      // Check if user is authorized
      if (session.seeker_id !== userId) {
        throw new Error('Unauthorized');
      }
      
      // Calculate session cost (hourly rate * duration in hours)
      const sessionDuration = sessionData.duration || 30; // Default to 30 minutes
      const durationInHours = sessionDuration / 60;
      const amount = Math.round(session.hourly_rate * durationInHours * 100); // Convert to cents
      
      // Create Stripe checkout session
      const checkoutSession = await stripeService.createCheckoutSession({
        sessionId: session.id,
        seekerId: session.seeker_id,
        professionalId: session.professional_id,
        amount: amount,
        currency: 'USD',
        successUrl: `${process.env.FRONTEND_URL}/sessions/${session.id}/payment/success`,
        cancelUrl: `${process.env.FRONTEND_URL}/sessions/${session.id}/payment/cancel`
      });
      
      // Create payment record
      await this.create({
        session_id: session.id,
        user_id: session.seeker_id,
        stripe_payment_id: checkoutSession.payment_intent,
        amount: amount / 100, // Store in dollars
        currency: 'USD',
        status: 'pending'
      });
      
      return {
        sessionId: session.id,
        checkoutSessionId: checkoutSession.id,
        checkoutSessionUrl: checkoutSession.url,
        amount: amount / 100 // Return in dollars
      };
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  /**
   * Process a webhook event from Stripe
   * @param {Object} event - Stripe event object
   * @returns {Object|null} Updated payment object or null
   */
  static async processWebhookEvent(event) {
    try {
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const payment = await this.findByStripePaymentId(paymentIntent.id);
          
          if (payment) {
            // Update payment status
            const updatedPayment = await this.complete(payment.id);
            return updatedPayment;
          }
          break;
        }
        
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          const payment = await this.findByStripePaymentId(paymentIntent.id);
          
          if (payment) {
            // Update payment status
            const updatedPayment = await this.markAsFailed(
              payment.id,
              paymentIntent.last_payment_error?.message || 'Payment failed'
            );
            return updatedPayment;
          }
          break;
        }
        
        case 'charge.refunded': {
          const charge = event.data.object;
          const payment = await this.findByStripePaymentId(charge.payment_intent);
          
          if (payment && payment.status !== 'refunded') {
            // Update payment status
            const [updatedPayment] = await db('payments')
              .where({ id: payment.id })
              .update({ status: 'refunded' })
              .returning('*');
            
            return updatedPayment;
          }
          break;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to process webhook event:', error);
      throw error;
    }
  }
}

module.exports = Payment;
