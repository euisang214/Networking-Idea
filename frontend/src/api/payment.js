import api from '../services/api/client';

const PaymentsAPI = {
  // Process session payment
  processSessionPayment: async (sessionId, paymentMethodId) => {
    const response = await api.post('/payments/session', {
      sessionId,
      paymentMethodId
    });
    return response.data.data;
  },
  
  // Create checkout session for subscription
  createCheckoutSession: async (planType) => {
    const response = await api.post('/payments/checkout', { planType });
    return response.data.data;
  },
  
  // Create Stripe connected account
  createConnectedAccount: async () => {
    const response = await api.post('/payments/connect-account');
    return response.data.data;
  }
};

export default PaymentsAPI;