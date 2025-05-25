const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');
if (config.app.mockIntegrations) {
  module.exports = require('./mocks/googleService');
  return;
}

class GoogleService {
  async verifyIdToken(idToken) {
    try {
      const response = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
        params: { id_token: idToken }
      });
      return response.data;
    } catch (err) {
      logger.error(`Google token verification failed: ${err.message}`);
      throw new Error('Invalid Google ID token');
    }
  }

  async getAvailability(accessToken, timeMin, timeMax) {
    try {
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        { timeMin, timeMax, items: [{ id: 'primary' }] },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data?.calendars?.primary?.busy || [];
    } catch (err) {
      logger.error(`Google calendar fetch failed: ${err.message}`);
      throw new Error('Failed to fetch Google Calendar availability');
    }
  }
}

module.exports = new GoogleService();
