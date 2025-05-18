/**
 * Zoom API service
 */
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Create an OAuth URL for authorization
 * @param {string} state - State parameter for security
 * @returns {string} OAuth authorization URL
 */
exports.createAuthUrl = (state) => {
  const baseUrl = 'https://zoom.us/oauth/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ZOOM_CLIENT_ID,
    redirect_uri: process.env.ZOOM_REDIRECT_URL,
    state: state
  });
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth flow
 * @returns {Object} Token response
 */
exports.getAccessToken = async (code) => {
  try {
    const tokenUrl = 'https://zoom.us/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.ZOOM_REDIRECT_URL
    });
    
    // Create Basic auth credentials
    const auth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');
    
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to get Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom access token');
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New token response
 */
exports.refreshAccessToken = async (refreshToken) => {
  try {
    const tokenUrl = 'https://zoom.us/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    // Create Basic auth credentials
    const auth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');
    
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to refresh Zoom access token:', error.response?.data || error.message);
    throw new Error('Failed to refresh Zoom access token');
  }
};

/**
 * Get current user profile from Zoom
 * @param {Object} credentials - Zoom credentials
 * @returns {Object} User profile
 */
exports.getCurrentUser = async (credentials) => {
  try {
    // If token is expired, refresh it
    const updatedCredentials = await ensureValidToken(credentials);
    
    const response = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${updatedCredentials.access_token}`
      }
    });
    
    return {
      profile: response.data,
      credentials: updatedCredentials
    };
  } catch (error) {
    logger.error('Failed to get Zoom user profile:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom user profile');
  }
};

/**
 * Create a Zoom meeting
 * @param {Object} credentials - Zoom credentials
 * @param {Object} meetingData - Meeting data
 * @returns {Object} Created meeting
 */
exports.createMeeting = async (credentials, meetingData) => {
  try {
    // If token is expired, refresh it
    const updatedCredentials = await ensureValidToken(credentials);
    
    const payload = {
      topic: meetingData.topic || 'Mentoring Session',
      type: 2, // Scheduled meeting
      start_time: meetingData.start_time,
      duration: meetingData.duration || 30,
      timezone: meetingData.timezone || 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: true,
        approval_type: 0, // Automatically approve
        audio: 'both',
        auto_recording: 'none'
      }
    };
    
    const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${updatedCredentials.access_token}`
      }
    });
    
    return {
      ...response.data,
      credentials: updatedCredentials
    };
  } catch (error) {
    logger.error('Failed to create Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
};

/**
 * Get a Zoom meeting
 * @param {Object} credentials - Zoom credentials
 * @param {string} meetingId - Meeting ID
 * @returns {Object} Meeting details
 */
exports.getMeeting = async (credentials, meetingId) => {
  try {
    // If token is expired, refresh it
    const updatedCredentials = await ensureValidToken(credentials);
    
    const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${updatedCredentials.access_token}`
      }
    });
    
    return {
      ...response.data,
      credentials: updatedCredentials
    };
  } catch (error) {
    logger.error('Failed to get Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom meeting');
  }
};

/**
 * Update a Zoom meeting
 * @param {Object} credentials - Zoom credentials
 * @param {string} meetingId - Meeting ID
 * @param {Object} meetingData - Meeting data to update
 * @returns {Object} Updated credentials
 */
exports.updateMeeting = async (credentials, meetingId, meetingData) => {
  try {
    // If token is expired, refresh it
    const updatedCredentials = await ensureValidToken(credentials);
    
    const payload = {};
    
    if (meetingData.topic) payload.topic = meetingData.topic;
    if (meetingData.start_time) payload.start_time = meetingData.start_time;
    if (meetingData.duration) payload.duration = meetingData.duration;
    if (meetingData.timezone) payload.timezone = meetingData.timezone;
    if (meetingData.settings) payload.settings = meetingData.settings;
    
    await axios.patch(`https://api.zoom.us/v2/meetings/${meetingId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${updatedCredentials.access_token}`
      }
    });
    
    return updatedCredentials;
  } catch (error) {
    logger.error('Failed to update Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to update Zoom meeting');
  }
};

/**
 * Delete a Zoom meeting
 * @param {Object} credentials - Zoom credentials
 * @param {string} meetingId - Meeting ID
 * @returns {Object} Updated credentials
 */
exports.deleteMeeting = async (credentials, meetingId) => {
  try {
    // If token is expired, refresh it
    const updatedCredentials = await ensureValidToken(credentials);
    
    await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${updatedCredentials.access_token}`
      },
      params: {
        schedule_for_reminder: false
      }
    });
    
    return updatedCredentials;
  } catch (error) {
    logger.error('Failed to delete Zoom meeting:', error.response?.data || error.message);
    throw new Error('Failed to delete Zoom meeting');
  }
};

/**
 * Generate a meeting invite link
 * @param {Object} credentials - Zoom credentials
 * @param {string} meetingId - Meeting ID
 * @returns {Object} Invite link
 */
exports.generateInviteLink = async (credentials, meetingId) => {
  try {
    // If token is expired, refresh it
    const updatedCredentials = await ensureValidToken(credentials);
    
    const meeting = await this.getMeeting(updatedCredentials, meetingId);
    
    return {
      inviteLink: meeting.join_url,
      password: meeting.password,
      credentials: updatedCredentials
    };
  } catch (error) {
    logger.error('Failed to generate Zoom invite link:', error.response?.data || error.message);
    throw new Error('Failed to generate Zoom invite link');
  }
};

/**
 * Verify webhook request
 * @param {string} signature - Zoom webhook signature
 * @param {string} timestamp - Zoom webhook timestamp
 * @param {string} payload - Request body
 * @returns {boolean} Whether the request is valid
 */
exports.verifyWebhook = (signature, timestamp, payload) => {
  try {
    // In a real implementation, you would verify the signature using HMAC
    // For this example, we'll just check if the required headers are present
    return !!signature && !!timestamp;
  } catch (error) {
    logger.error('Failed to verify Zoom webhook:', error);
    return false;
  }
};

/**
 * Handle Zoom webhook event
 * @param {Object} event - Webhook event data
 * @returns {Object} Processed event data
 */
exports.handleWebhookEvent = (event) => {
  // Process different event types
  switch (event.event) {
    case 'meeting.started':
      return {
        type: 'meeting_started',
        meetingId: event.payload.object.id,
        startTime: event.payload.object.start_time,
        topic: event.payload.object.topic
      };
    
    case 'meeting.ended':
      return {
        type: 'meeting_ended',
        meetingId: event.payload.object.id,
        endTime: event.payload.object.end_time,
        topic: event.payload.object.topic
      };
    
    case 'meeting.participant_joined':
      return {
        type: 'participant_joined',
        meetingId: event.payload.object.id,
        participantId: event.payload.object.participant.id,
        participantName: event.payload.object.participant.user_name,
        joinTime: event.payload.object.participant.join_time
      };
    
    case 'meeting.participant_left':
      return {
        type: 'participant_left',
        meetingId: event.payload.object.id,
        participantId: event.payload.object.participant.id,
        participantName: event.payload.object.participant.user_name,
        leaveTime: event.payload.object.participant.leave_time
      };
    
    default:
      return {
        type: 'unknown',
        event: event.event,
        data: event.payload
      };
  }
};

/**
 * Helper function to ensure the access token is valid
 * @param {Object} credentials - Zoom credentials
 * @returns {Object} Updated credentials
 */
async function ensureValidToken(credentials) {
  // Check if credentials object is valid
  if (!credentials || !credentials.access_token) {
    throw new Error('Invalid Zoom credentials');
  }
  
  // Check if token is expired
  const now = Date.now();
  const tokenExpires = credentials.expires_at || 0;
  
  // If token is expired or about to expire (within 5 minutes), refresh it
  if (now >= (tokenExpires - 5 * 60 * 1000)) {
    try {
      // Refresh the token
      const newTokens = await exports.refreshAccessToken(credentials.refresh_token);
      
      // Calculate token expiration (now + expires_in seconds)
      const expiresAt = Date.now() + (newTokens.expires_in * 1000);
      
      // Return updated credentials
      return {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        token_type: newTokens.token_type,
        expires_in: newTokens.expires_in,
        expires_at: expiresAt
      };
    } catch (error) {
      logger.error('Failed to refresh Zoom token:', error);
      throw new Error('Failed to refresh Zoom token');
    }
  }
  
  // Token is still valid, return the original credentials
  return credentials;
}
