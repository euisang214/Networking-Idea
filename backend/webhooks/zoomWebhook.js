const express = require('express');
const router = express.Router();
const ZoomService = require('../services/zoomService');
const SessionService = require('../services/sessionService');
const PaymentService = require('../services/paymentService');
const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');
const { ExternalServiceError } = require('../utils/errorTypes');

// Function to handle meeting ended event
const handleMeetingEnded = async (payload) => {
  try {
    const meetingId = payload.object.id;
    logger.info(`Zoom meeting ended webhook received for meeting ${meetingId}`);
    
    // Find the session associated with this meeting
    const session = await SessionService.findByZoomMeetingId(meetingId);
    
    if (!session) {
      logger.warn(`No session found for Zoom meeting ${meetingId}`);
      return null;
    }
    
    // Verify the meeting through Zoom API
    const meetingVerification = await ZoomService.verifyMeeting(meetingId);
    
    if (!meetingVerification.verified) {
      logger.warn(`Meeting ${meetingId} verification failed: ${meetingVerification.reason}`);
      return {
        success: false,
        sessionId: session._id,
        reason: meetingVerification.reason
      };
    }
    
    // Mark session as verified
    await SessionService.markAsVerified(session._id, meetingVerification);
    
    // Release payment to professional
    const paymentResult = await PaymentService.releaseSessionPayment(session._id);
    
    logger.info(`Session ${session._id} verified and payment released`);
    
    return {
      success: true,
      sessionId: session._id,
      meetingId: meetingId,
      paymentReleased: paymentResult.success
    };
  } catch (error) {
    logger.error(`Error handling meeting ended event: ${error.message}`);
    throw new ExternalServiceError(error.message, 'Zoom');
  }
};

// Zoom webhook endpoint
router.post('/', async (req, res) => {
  try {
    // Verify webhook signature
    const isValid = ZoomService.verifyWebhookSignature(req);
    
    if (!isValid) {
      logger.warn('Invalid Zoom webhook signature');
      return responseFormatter.error(res, 'Invalid signature', 401);
    }
    
    const { event, payload } = req.body;
    
    // Handle different event types
    switch (event) {
      case 'meeting.ended':
        const result = await handleMeetingEnded(payload);
        return responseFormatter.success(res, result);
        
      case 'meeting.started':
        // Update session status to in-progress
        if (payload.object && payload.object.id) {
          const session = await SessionService.findByZoomMeetingId(payload.object.id);
          if (session) {
            await SessionService.updateSessionStatus(session._id, 'in-progress');
          }
        }
        return responseFormatter.success(res);
        
      case 'meeting.participant_joined':
      case 'meeting.participant_left':
        // Could implement participant tracking here
        return responseFormatter.success(res);
        
      default:
        // Acknowledge other event types
        logger.debug(`Unhandled Zoom event type: ${event}`);
        return responseFormatter.success(res);
    }
  } catch (error) {
    logger.error(`Zoom webhook error: ${error.message}`);
    return responseFormatter.serverError(res, error.message);
  }
});

module.exports = router;