const PaymentService = require('../services/paymentService');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthorizationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// Controller for payment-related operations
const PaymentController = {
  // Process session payment
  processSessionPayment: async (req, res, next) => {
    try {
      const { sessionId, paymentMethodId } = req.body;
      const userId = req.user.id;
      
      // Validate required fields
      if (!sessionId || !paymentMethodId) {
        throw new ValidationError('Session ID and payment method ID are required');
      }
      
      // Process payment
      const result = await PaymentService.processSessionPayment(sessionId, paymentMethodId, userId);
      
      return responseFormatter.success(res, {
        paymentId: result.paymentId,
        status: result.status,
        clientSecret: result.clientSecret
      }, 'Payment processed successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Release session payment (admin only)
  releaseSessionPayment: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      // Check if user is an admin
      const user = await req.app.get('db').user.findById(userId);
      
      if (!user || user.userType !== 'admin') {
        throw new AuthorizationError('Only admins can manually release payments');
      }
      
      // Release payment
      const result = await PaymentService.releaseSessionPayment(sessionId);
      
      return responseFormatter.success(res, {
        sessionId: result.sessionId,
        amount: result.amount
      }, 'Payment released successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Process referral payment (admin only)
  processReferralPayment: async (req, res, next) => {
    try {
      const { referralId } = req.params;
      const userId = req.user.id;
      
      // Check if user is an admin
      const user = await req.app.get('db').user.findById(userId);
      
      if (!user || user.userType !== 'admin') {
        throw new AuthorizationError('Only admins can manually process referral payments');
      }
      
      // Process payment
      const result = await PaymentService.processReferralPayment(referralId);
      
      return responseFormatter.success(res, {
        referralId: result.referralId,
        transferId: result.transferId,
        amount: result.amount
      }, 'Referral payment processed successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Create checkout session for subscription
  createCheckoutSession: async (req, res, next) => {
    try {
      const { planType } = req.body;
      const userId = req.user.id;
      
      // Validate required fields
      if (!planType) {
        throw new ValidationError('Plan type is required');
      }
      
      // Create checkout session
      const result = await PaymentService.createCheckoutSession(userId, planType);
      
      return responseFormatter.success(res, {
        sessionId: result.sessionId,
        url: result.url
      }, 'Checkout session created successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Create Stripe connected account
  createConnectedAccount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get professional ID
      const professionalProfile = await req.app.get('db').professionalProfile.findOne({
        user: userId
      });
      
      if (!professionalProfile) {
        throw new ValidationError('You do not have a professional profile');
      }
      
      // Create connected account
      const result = await PaymentService.createConnectedAccount(professionalProfile._id);
      
      return responseFormatter.success(res, {
        accountId: result.accountId,
        onboardingUrl: result.onboardingUrl
      }, 'Connected account created successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PaymentController;