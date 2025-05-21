const logger = require('../../utils/logger');

function mockResponse(data = {}) {
  return { id: `${data.type || 'mock'}_${Date.now()}`, ...data };
}

exports.createCheckoutSession = async (opts) => {
  logger.debug('Mock Stripe createCheckoutSession', opts);
  return mockResponse({ type: 'cs', url: 'https://stripe.mock/checkout' });
};

exports.createConnectAccount = async (professionalId, email) => {
  logger.debug('Mock Stripe createConnectAccount', { professionalId, email });
  return { accountId: 'acct_mock', accountLink: 'https://stripe.mock/connect' };
};

exports.getConnectAccount = async (accountId) => {
  logger.debug('Mock Stripe getConnectAccount', { accountId });
  return mockResponse({ type: 'acct' });
};

exports.createRefund = async (paymentIntentId, reason = 'requested_by_customer') => {
  logger.debug('Mock Stripe createRefund', { paymentIntentId, reason });
  return mockResponse({ type: 'refund', reason });
};

exports.createDirectCharge = async (opts) => {
  logger.debug('Mock Stripe createDirectCharge', opts);
  return mockResponse({ type: 'pi' });
};

exports.createCustomer = async (email, name) => {
  logger.debug('Mock Stripe createCustomer', { email, name });
  return mockResponse({ type: 'cus', email, name });
};

exports.createPaymentMethod = async (customerId, data) => {
  logger.debug('Mock Stripe createPaymentMethod', { customerId, data });
  return mockResponse({ type: 'pm' });
};

exports.confirmPaymentIntent = async (paymentIntentId) => {
  logger.debug('Mock Stripe confirmPaymentIntent', { paymentIntentId });
  return mockResponse({ type: 'pi_confirmed' });
};

exports.handleWebhookEvent = (payload, signature) => {
  logger.debug('Mock Stripe handleWebhookEvent', { payload, signature });
  return { id: 'evt_mock', type: 'mock.event', data: {} };
};

exports.getPaymentIntent = async (paymentIntentId) => {
  logger.debug('Mock Stripe getPaymentIntent', { paymentIntentId });
  return mockResponse({ type: 'pi' });
};

exports.listPayouts = async (accountId, options = {}) => {
  logger.debug('Mock Stripe listPayouts', { accountId, options });
  return [];
};
