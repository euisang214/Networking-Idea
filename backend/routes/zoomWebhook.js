/**
 * Zoom webhook handler
 */
const crypto = require('crypto');
const zoomService = require('../services/zoomService');
const SessionModel = require('../models/session');
const UserModel = require('../models/user');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Verify Zoom webhook signature
 * @param {string} signature - Zoom webhook signature
 * @param {string} timestamp - Zoom webhook timestamp
 * @param {Object} payload - Request body
 * @returns {boolean} Whether the webhook is valid
 */
exports.verifyWebhook = (signature, timestamp, payload) => {
  try {
    if (!signature || !timestamp || !process.env.ZOOM_WEBHOOK_SECRET) {
      return false;
    }
    
    // Zoom uses HMAC-SHA256 for webhook signature validation
    const message = `v0:${timestamp}:${JSON.stringify(payload)}`;
    const hashForVerify = crypto
      .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET)
      .update(message)
      .digest('hex');
    
    // Construct the expected signature
    const expectedSignature = `v0=${hashForVerify}`;
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Error verifying Zoom webhook:', error);
    return false;
  }
};

/**
 * Handle Zoom webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    logger.info(`Received Zoom webhook event: ${event.event}`);
    
    // Process the event
    const processedEvent = zoomService.handleWebhookEvent(event);
    
    // Handle different event types
    switch (processedEvent.type) {
      case 'meeting_started':
        await handleMeetingStarted(processedEvent);
        break;
        
      case 'meeting_ended':
        await handleMeetingEnded(processedEvent);
        break;
        
      case 'participant_joined':
        await handleParticipantJoined(processedEvent);
        break;
        
      case 'participant_left':
        await handleParticipantLeft(processedEvent);
        break;
        
      default:
        logger.info(`Unhandled Zoom webhook event: ${processedEvent.type}`);
    }
    
    // Return success response
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Zoom webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

/**
 * Handle meeting_started event
 * @param {Object} eventData - Processed event data
 */
async function handleMeetingStarted(eventData) {
  try {
    // Find session by Zoom meeting ID
    const session = await SessionModel.findByZoomMeetingId(eventData.meetingId);
    
    if (!session) {
      logger.warn(`Session not found for Zoom meeting ID: ${eventData.meetingId}`);
      return;
    }
    
    // Get participants
    const seeker = await UserModel.findById(session.seeker_id);
    const professional = await UserModel.findById(session.professional_id);
    
    // Send notifications to participants
    await notificationService.createNotification({
      user_id: seeker.id,
      title: 'Session Started',
      content: `Your session with ${professional.first_name} ${professional.last_name} has started. Join now!`,
      type: 'session'
    });
    
    await notificationService.createNotification({
      user_id: professional.id,
      title: 'Session Started',
      content: 'Your session has started. Join now!',
      type: 'session'
    });
    
    logger.info(`Meeting started notification sent for session ${session.id}`);
  } catch (error) {
    logger.error('Error handling meeting_started event:', error);
    throw error;
  }
}

/**
 * Handle meeting_ended event
 * @param {Object} eventData - Processed event data
 */
async function handleMeetingEnded(eventData) {
  try {
    // Find session by Zoom meeting ID
    const session = await SessionModel.findByZoomMeetingId(eventData.meetingId);
    
    if (!session) {
      logger.warn(`Session not found for Zoom meeting ID: ${eventData.meetingId}`);
      return;
    }
    
    // Check if session is not already completed
    if (session.status !== 'completed') {
      // Mark session as completed
      await SessionModel.markAsCompleted(session.id);
      
      // Get participants
      const seeker = await UserModel.findById(session.seeker_id);
      const professional = await UserModel.findById(session.professional_id);
      
      // Send notifications
      await notificationService.createNotification({
        user_id: seeker.id,
        title: 'Session Completed',
        content: `Your session with ${professional.first_name} ${professional.last_name} has been completed. Please provide feedback.`,
        type: 'session'
      });
      
      await notificationService.createNotification({
        user_id: professional.id,
        title: 'Session Completed',
        content: 'Your session has been completed. Thank you for your time.',
        type: 'session'
      });
      
      logger.info(`Session ${session.id} marked as completed`);
    }
  } catch (error) {
    logger.error('Error handling meeting_ended event:', error);
    throw error;
  }
}

/**
 * Handle participant_joined event
 * @param {Object} eventData - Processed event data
 */
async function handleParticipantJoined(eventData) {
  try {
    // Find session by Zoom meeting ID
    const session = await SessionModel.findByZoomMeetingId(eventData.meetingId);
    
    if (!session) {
      logger.warn(`Session not found for Zoom meeting ID: ${eventData.meetingId}`);
      return;
    }
    
    // Log participant join
    logger.info(`Participant ${eventData.participantName} joined session ${session.id}`);
    
    // For more complex implementations, you could track participants
    // and send notifications if relevant
  } catch (error) {
    logger.error('Error handling participant_joined event:', error);
    throw error;
  }
}

/**
 * Handle participant_left event
 * @param {Object} eventData - Processed event data
 */
async function handleParticipantLeft(eventData) {
  try {
    // Find session by Zoom meeting ID
    const session = await SessionModel.findByZoomMeetingId(eventData.meetingId);
    
    if (!session) {
      logger.warn(`Session not found for Zoom meeting ID: ${eventData.meetingId}`);
      return;
    }
    
    // Log participant leave
    logger.info(`Participant ${eventData.participantName} left session ${session.id}`);
    
    // For more complex implementations, you could track participants
    // and check if all participants have left to auto-end the meeting
  } catch (error) {
    logger.error('Error handling participant_left event:', error);
    throw error;
  }
}

/**
 * Find a session by Zoom meeting ID
 * @param {string} meetingId - Zoom meeting ID
 * @returns {Object|null} Session object or null if not found
 */
async function findSessionByZoomMeetingId(meetingId) {
  // This function would query your database to find a session
  // by Zoom meeting ID. The implementation depends on your data model.
  
  // For this example, we'll just return null
  return null;
}
