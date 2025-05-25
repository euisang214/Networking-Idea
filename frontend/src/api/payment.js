import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const PaymentsAPI = {
  /**
   * Process payment for a session
   * @param {string} sessionId - Session identifier
   * @param {string} paymentMethodId - Stripe payment method id
   * @returns {Promise<Object>} Payment data
   */
  createSessionPayment: (sessionId, paymentMethodId) =>
    handleRequest(
      api.post('/payments/session', {
        sessionId,
        paymentMethodId
      })
    ),
  
  /**
   * Create a checkout session for subscriptions
   * @param {string} planType - Subscription plan type
   * @returns {Promise<Object>} Checkout data
   */
  createCheckoutSession: (planType) =>
    handleRequest(api.post('/payments/checkout', { planType })),
  
  /**
   * Create a Stripe connected account
   * @returns {Promise<Object>} Stripe onboarding data
   */
  createConnectedAccount: () =>
    handleRequest(api.post('/payments/connect-account'))
};

export default PaymentsAPI;