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
  if (typeof window !== 'undefined' && typeof window.meta !== 'undefined') {
    // Vite exposes env vars on import.meta.env
    if (window.meta.env && Object.prototype.hasOwnProperty.call(window.meta.env, name)) {
      return window.meta.env[name];
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
  // Check if running in Docker by looking for common Docker environment variables
  const isDocker = process.env.REACT_APP_DOCKER === 'true' ||
                   (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80'));
  
  const config = {
    apiUrl: getEnv('REACT_APP_API_URL') || (isDocker ? '/api' : 'http://localhost:8000/api'),
    stripePublicKey: getEnv('REACT_APP_STRIPE_PUBLIC_KEY'),
  };

  if (!config.stripePublicKey) {
    throw new Error('REACT_APP_STRIPE_PUBLIC_KEY environment variable is required');
  }

  return config;
}
const config = loadConfig();

export default config;
