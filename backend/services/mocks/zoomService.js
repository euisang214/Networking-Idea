const logger = require('../../utils/logger');

class MockZoomService {
  async getZoomToken() {
    logger.debug('Mock getZoomToken');
    return 'mock_zoom_token';
  }

  async createMeeting(session, professional, user) {
    logger.debug('Mock createMeeting', { session, professional, user });
    return {
      meetingId: 'zoom_mock_meeting',
      meetingUrl: 'https://zoom.mock/join',
      password: 'mockpass',
      startUrl: 'https://zoom.mock/start'
    };
  }

  async verifyMeeting(meetingId) {
    logger.debug('Mock verifyMeeting', { meetingId });
    return {
      verified: true,
      duration: 30,
      participantCount: 2,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 1800000).toISOString()
    };
  }

  verifyWebhookSignature() { return true; }
  generateMeetingPassword() { return 'mockpass'; }
  async handleMeetingEnded() { return { verified: true }; }
}

module.exports = new MockZoomService();
