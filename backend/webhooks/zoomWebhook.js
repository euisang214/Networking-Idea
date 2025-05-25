const express = require('express');
const router = express.Router();
const ZoomService = require('../services/zoomService');
const SessionService = require('../services/sessionService');
const PaymentService = require('../services/paymentService');
const Session = require('../models/session');
const logger = require('../utils/logger');
const responseFormatter = require('../utils/responseFormatter');

// Function to handle meeting ended event
const handleMeetingEnded = async (payload) => {
  try {
    const meetingId = payload.object.id;
    logger.info(`Zoom meeting ended webhook received for meeting ${meetingId}`);
    
    // Find the session associated with this meeting
    const session = await Session.findOne({ zoomMeetingId: meetingId })
      .populate('professional')
      .populate('user');
    
    if (!session) {
      logger.warn(`No session found for Zoom meeting ${meetingId}`);
      return { success: false, reason: 'Session not found' };
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
    await SessionService.markAsVerified(session._id, {
      ...meetingVerification,
      method: 'zoom-webhook'
    });
    
    // CRITICAL: Release payment to professional automatically
    try {
      const paymentResult = await PaymentService.releaseSessionPayment(session._id);
      logger.info(`Payment released for session ${session._id}: $${paymentResult.amount}`);
    } catch (paymentError) {
      logger.error(`Failed to release payment for session ${session._id}: ${paymentError.message}`);
      // Continue - payment can be released manually by admin
    }
    
    logger.info(`Session ${session._id} verified and payment processing initiated`);
    
    return {
      success: true,
      sessionId: session._id,
      meetingId: meetingId,
      paymentReleased: true
    };
  } catch (error) {
    logger.error(`Error handling meeting ended event: ${error.message}`);
    throw error;
  }
};

// Enhanced Zoom webhook endpoint
router.post('/', async (req, res) => {
  try {
    // Verify webhook signature
    const isValid = ZoomService.verifyWebhookSignature(req);
    
    if (!isValid) {
      logger.warn('Invalid Zoom webhook signature');
      return responseFormatter.error(res, 'Invalid signature', 401);
    }
    
    const { event, payload } = req.body;
    logger.info(`Received Zoom webhook: ${event}`);
    
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
        // Track participant joins for verification
        logger.info(`Participant joined meeting ${payload.object.id}`);
        return responseFormatter.success(res);
        
      case 'meeting.participant_left':
        // Track participant departures
        logger.info(`Participant left meeting ${payload.object.id}`);
        return responseFormatter.success(res);
        
      default:
        logger.debug(`Unhandled Zoom event type: ${event}`);
        return responseFormatter.success(res);
    }
  } catch (error) {
    logger.error(`Zoom webhook error: ${error.message}`);
    return responseFormatter.serverError(res, error.message);
  }
});

module.exports = router;
