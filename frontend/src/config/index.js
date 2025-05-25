/**
 * Application configuration loaded from environment variables.
 *
 * @typedef {Object} AppConfig
 * @property {string} apiUrl - Base URL for API requests
 * @property {string} stripePublicKey - Public key for Stripe.js
 */

/**
 * Retrieve environment variable value.
 * Supports both process.env and import.meta.env for compatibility.
 *
 * @param {string} name
 * @returns {string | undefined}
 */
function getEnv(name) {
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined') {
    // Vite exposes env vars on import.meta.env
    if (import.meta.env && Object.prototype.hasOwnProperty.call(import.meta.env, name)) {
      return import.meta.env[name];
    }
  }
  return process.env[name];
}

/**
 * Validate environment variables and construct the configuration object.
 *
 * @returns {AppConfig}
 */
function loadConfig() {
  const config = {
    apiUrl: getEnv('REACT_APP_API_URL') || '/api',
    stripePublicKey: getEnv('REACT_APP_STRIPE_PUBLIC_KEY'),
  };

  if (!config.stripePublicKey) {
    throw new Error('REACT_APP_STRIPE_PUBLIC_KEY environment variable is required');
  }

  return config;
}

const config = loadConfig();

export default config;
