/**
 * Stripe payment service
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

/**
 * Create a checkout session for a mentoring session
 * @param {Object} options - Options for creating the checkout session
 * @param {string} options.sessionId - Mentoring session ID
 * @param {string} options.seekerId - Seeker user ID
 * @param {string} options.professionalId - Professional user ID
 * @param {number} options.amount - Amount in cents
 * @param {string} options.currency - Currency code (default: 'usd')
 * @param {string} options.successUrl - Success redirect URL
 * @param {string} options.cancelUrl - Cancel redirect URL
 * @returns {Object} Stripe checkout session
 */
exports.createCheckoutSession = async ({
  sessionId,
  seekerId,
  professionalId,
  amount,
  currency = 'usd',
  successUrl,
  cancelUrl
}) => {
  try {
    // Calculate platform fee (e.g., 10% of the amount)
    const platformFeePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
    const platformFeeAmount = Math.round(amount * (platformFeePercent / 100));
    
    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Mentoring Session',
              description: 'Professional networking session'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: sessionId,
      customer_email: seekerId, // For simplicity, using seekerId as email (should be actual email in production)
      payment_intent_data: {
        metadata: {
          session_id: sessionId,
          seeker_id: seekerId,
          professional_id: professionalId
        },
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: professionalId // This assumes the professional has a Stripe Connect account
        }
      },
      metadata: {
        session_id: sessionId,
        seeker_id: seekerId,
        professional_id: professionalId
      }
    });
    
    return checkoutSession;
  } catch (error) {
    logger.error('Error creating Stripe checkout session:', error);
    throw error;
  }
};

/**
 * Create a Stripe Connect account for a professional
 * @param {string} professionalId - Professional user ID
 * @param {string} email - Professional's email
 * @returns {Object} Stripe Connect account link data
 */
exports.createConnectAccount = async (professionalId, email) => {
  try {
    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'standard',
      email: email,
      metadata: {
        professional_id: professionalId
      }
    });
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/professionals/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL}/professionals/stripe/complete`,
      type: 'account_onboarding'
    });
    
    return {
      accountId: account.id,
      accountLink: accountLink.url
    };
  } catch (error) {
    logger.error('Error creating Stripe Connect account:', error);
    throw error;
  }
};

/**
 * Retrieve a Stripe Connect account
 * @param {string} accountId - Stripe account ID
 * @returns {Object} Stripe Connect account data
 */
exports.getConnectAccount = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    logger.error('Error retrieving Stripe Connect account:', error);
    throw error;
  }
};

/**
 * Process a refund for a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {string} reason - Refund reason
 * @returns {Object} Refund data
 */
exports.createRefund = async (paymentIntentId, reason = 'requested_by_customer') => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason
    });
    
    return refund;
  } catch (error) {
    logger.error('Error creating refund:', error);
    throw error;
  }
};

/**
 * Create a direct charge to a connected account
 * @param {Object} options - Options for creating the charge
 * @param {string} options.customerId - Stripe customer ID
 * @param {string} options.accountId - Stripe Connect account ID
 * @param {number} options.amount - Amount in cents
 * @param {string} options.currency - Currency code (default: 'usd')
 * @param {string} options.description - Charge description
 * @returns {Object} Charge data
 */
exports.createDirectCharge = async ({
  customerId,
  accountId,
  amount,
  currency = 'usd',
  description
}) => {
  try {
    // Calculate platform fee (e.g., 10% of the amount)
    const platformFeePercent = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
    const platformFeeAmount = Math.round(amount * (platformFeePercent / 100));
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customerId,
      description: description,
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: accountId
      }
    });
    
    return paymentIntent;
  } catch (error) {
    logger.error('Error creating direct charge:', error);
    throw error;
  }
};

/**
 * Create a Stripe customer
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Object} Stripe customer data
 */
exports.createCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email: email,
      name: name
    });
    
    return customer;
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Create a payment method for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {Object} paymentMethodData - Payment method data
 * @returns {Object} Payment method data
 */
exports.createPaymentMethod = async (customerId, paymentMethodData) => {
  try {
    // Create payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: paymentMethodData.card_number,
        exp_month: paymentMethodData.exp_month,
        exp_year: paymentMethodData.exp_year,
        cvc: paymentMethodData.cvc
      },
      billing_details: {
        name: paymentMethodData.name,
        email: paymentMethodData.email
      }
    });
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id
      }
    });
    
    return paymentMethod;
  } catch (error) {
    logger.error('Error creating payment method:', error);
    throw error;
  }
};

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Object} Confirmed payment intent
 */
exports.confirmPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error('Error confirming payment intent:', error);
    throw error;
  }
};

/**
 * Handle Stripe webhook events
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} Event data
 */
exports.handleWebhookEvent = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    return event;
  } catch (error) {
    logger.error('Error constructing Stripe webhook event:', error);
    throw error;
  }
};

/**
 * Get payment intent details
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Object} Payment intent data
 */
exports.getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error('Error retrieving payment intent:', error);
    throw error;
  }
};

/**
 * List payouts for a connected account
 * @param {string} accountId - Stripe Connect account ID
 * @param {Object} options - Query options
 * @returns {Array} Payouts list
 */
exports.listPayouts = async (accountId, options = {}) => {
  try {
    const payouts = await stripe.payouts.list({
      ...options,
      stripeAccount: accountId
    });
    
    return payouts;
  } catch (error) {
    logger.error('Error listing payouts:', error);
    throw error;
  }
};
