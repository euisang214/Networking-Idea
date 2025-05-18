/**
 * Session controller
 */
const { validationResult } = require('express-validator');
const SessionModel = require('../models/session');
const PaymentModel = require('../models/payment');
const UserModel = require('../models/user');
const ProfessionalProfileModel = require('../models/professionalProfile');
const zoomService = require('../services/zoomService');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errorTypes');

/**
 * Create a new session
 */
exports.createSession = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    const { professional_id, scheduled_at, duration_minutes } = req.body;
    const seeker_id = req.user.id;

    // Check if professional exists
    const professional = await UserModel.findById(professional_id);
    if (!professional || professional.role !== 'professional') {
      throw new NotFoundError('Professional not found');
    }

    // Check if professional is available at the requested time
    const startTime = new Date(scheduled_at);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (duration_minutes || 30));

    const isAvailable = await SessionModel.isTimeSlotAvailable(
      professional_id,
      startTime,
      endTime
    );

    if (!isAvailable) {
      throw new BadRequestError('The professional is not available at the requested time');
    }

    // Get professional profile to check if zoom credentials exist
    const professionalProfile = await ProfessionalProfileModel.findByUserId(professional_id);
    if (!professionalProfile) {
      throw new NotFoundError('Professional profile not found');
    }

    let zoomMeetingId = null;
    let zoomMeetingUrl = null;
    let zoomMeetingPassword = null;

    // Create Zoom meeting if professional has Zoom credentials
    if (professionalProfile.zoom_credentials) {
      try {
        const zoomMeeting = await zoomService.createMeeting(
          professionalProfile.zoom_credentials,
          {
            topic: 'Mentoring Session',
            start_time: startTime.toISOString(),
            duration: duration_minutes || 30
          }
        );

        zoomMeetingId = zoomMeeting.id;
        zoomMeetingUrl = zoomMeeting.join_url;
        zoomMeetingPassword = zoomMeeting.password;
      } catch (error) {
        logger.error('Failed to create Zoom meeting:', error);
        // Continue without Zoom meeting
      }
    }

    // Create the session
    const session = await SessionModel.create({
      seeker_id,
      professional_id,
      zoom_meeting_id: zoomMeetingId,
      zoom_meeting_url: zoomMeetingUrl,
      zoom_meeting_password: zoomMeetingPassword,
      scheduled_at,
      duration_minutes: duration_minutes || 30,
      status: 'scheduled'
    });

    // Send confirmation emails
    const seeker = await UserModel.findById(seeker_id);
    
    await emailService.sendSessionConfirmation(seeker.email, {
      firstName: seeker.first_name,
      sessionDate: startTime,
      duration: duration_minutes || 30,
      professionalName: `${professional.first_name} ${professional.last_name}`,
      zoomUrl: zoomMeetingUrl
    });

    await emailService.sendSessionNotification(professional.email, {
      firstName: professional.first_name,
      sessionDate: startTime,
      duration: duration_minutes || 30,
      seekerName: professional.is_anonymized 
        ? 'Anonymous User' 
        : `${seeker.first_name} ${seeker.last_name}`,
      zoomUrl: zoomMeetingUrl
    });

    // Create notifications
    await notificationService.createNotification({
      userId: seeker_id,
      title: 'Session Booked',
      content: `Your session with ${professional.first_name} ${professional.last_name} has been scheduled for ${startTime.toLocaleString()}`,
      type: 'session'
    });

    await notificationService.createNotification({
      userId: professional_id,
      title: 'New Session Request',
      content: `You have a new session scheduled for ${startTime.toLocaleString()}`,
      type: 'session'
    });

    // Return the created session
    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a session by ID
 */
exports.getSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the session with user details
    const session = await SessionModel.findById(id, true);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check if user is authorized to access this session
    if (session.seeker_id !== userId && session.professional_id !== userId) {
      throw new ForbiddenError('You are not authorized to access this session');
    }

    // Return the session
    res.status(200).json({
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sessions for the current user
 */
exports.getMySessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit, status, startDate, endDate } = req.query;

    // Validate that role is either seeker or professional
    if (userRole !== 'seeker' && userRole !== 'professional') {
      throw new BadRequestError('Invalid user role');
    }

    // Get sessions for the user
    const sessionsData = await SessionModel.listForUser(userId, userRole, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      status,
      startDate,
      endDate,
      includeUsers: true
    });

    // Return sessions
    res.status(200).json(sessionsData);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a session
 */
exports.updateSession = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { scheduled_at, duration_minutes } = req.body;

    // Find the session
    const session = await SessionModel.findById(id);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check if user is authorized to update this session
    if (session.seeker_id !== userId && session.professional_id !== userId) {
      throw new ForbiddenError('You are not authorized to update this session');
    }

    // Only allow updates to scheduled sessions
    if (session.status !== 'scheduled') {
      throw new BadRequestError(`Cannot update session with status ${session.status}`);
    }

    // Prepare update data
    const updateData = {};
    
    if (scheduled_at) {
      // Check if new time slot is available
      const startTime = new Date(scheduled_at);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (duration_minutes || session.duration_minutes));

      const isAvailable = await SessionModel.isTimeSlotAvailable(
        session.professional_id,
        startTime,
        endTime
      );

      if (!isAvailable) {
        throw new BadRequestError('The professional is not available at the requested time');
      }

      updateData.scheduled_at = scheduled_at;

      // Update Zoom meeting if it exists
      if (session.zoom_meeting_id) {
        try {
          const professionalProfile = await ProfessionalProfileModel.findByUserId(session.professional_id);
          
          if (professionalProfile && professionalProfile.zoom_credentials) {
            await zoomService.updateMeeting(
              professionalProfile.zoom_credentials,
              session.zoom_meeting_id,
              {
                start_time: startTime.toISOString(),
                duration: duration_minutes || session.duration_minutes
              }
            );
          }
        } catch (error) {
          logger.error('Failed to update Zoom meeting:', error);
          // Continue without updating Zoom meeting
        }
      }
    }

    if (duration_minutes) {
      updateData.duration_minutes = duration_minutes;
    }

    // Update the session
    const updatedSession = await SessionModel.update(id, updateData);

    // Send notifications
    if (Object.keys(updateData).length > 0) {
      // Get participant details
      const seeker = await UserModel.findById(session.seeker_id);
      const professional = await UserModel.findById(session.professional_id);

      // Determine who initiated the update
      const initiator = userId === session.seeker_id ? 'seeker' : 'professional';

      // Send notifications to both parties
      if (initiator === 'seeker') {
        await notificationService.createNotification({
          userId: session.professional_id,
          title: 'Session Updated',
          content: `A session has been rescheduled to ${new Date(updatedSession.scheduled_at).toLocaleString()}`,
          type: 'session'
        });

        await emailService.sendSessionUpdate(professional.email, {
          firstName: professional.first_name,
          sessionDate: new Date(updatedSession.scheduled_at),
          duration: updatedSession.duration_minutes,
          seekerName: `${seeker.first_name} ${seeker.last_name}`,
          zoomUrl: updatedSession.zoom_meeting_url
        });
      } else {
        await notificationService.createNotification({
          userId: session.seeker_id,
          title: 'Session Updated',
          content: `Your session with ${professional.first_name} ${professional.last_name} has been rescheduled to ${new Date(updatedSession.scheduled_at).toLocaleString()}`,
          type: 'session'
        });

        await emailService.sendSessionUpdate(seeker.email, {
          firstName: seeker.first_name,
          sessionDate: new Date(updatedSession.scheduled_at),
          duration: updatedSession.duration_minutes,
          professionalName: `${professional.first_name} ${professional.last_name}`,
          zoomUrl: updatedSession.zoom_meeting_url
        });
      }
    }

    // Return the updated session
    res.status(200).json({
      message: 'Session updated successfully',
      session: updatedSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a session
 */
exports.cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the session
    const session = await SessionModel.findById(id);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check if user is authorized to cancel this session
    if (session.seeker_id !== userId && session.professional_id !== userId) {
      throw new ForbiddenError('You are not authorized to cancel this session');
    }

    // Only allow cancellation of scheduled sessions
    if (session.status !== 'scheduled') {
      throw new BadRequestError(`Cannot cancel session with status ${session.status}`);
    }

    // Cancel the session
    const cancelledSession = await SessionModel.cancel(id);

    // Cancel Zoom meeting if it exists
    if (session.zoom_meeting_id) {
      try {
        const professionalProfile = await ProfessionalProfileModel.findByUserId(session.professional_id);
        
        if (professionalProfile && professionalProfile.zoom_credentials) {
          await zoomService.deleteMeeting(
            professionalProfile.zoom_credentials,
            session.zoom_meeting_id
          );
        }
      } catch (error) {
        logger.error('Failed to cancel Zoom meeting:', error);
        // Continue without cancelling Zoom meeting
      }
    }

    // Get participant details
    const seeker = await UserModel.findById(session.seeker_id);
    const professional = await UserModel.findById(session.professional_id);

    // Determine who initiated the cancellation
    const initiator = userId === session.seeker_id ? 'seeker' : 'professional';

    // Send notifications to both parties
    if (initiator === 'seeker') {
      await notificationService.createNotification({
        userId: session.professional_id,
        title: 'Session Cancelled',
        content: `A session scheduled for ${new Date(session.scheduled_at).toLocaleString()} has been cancelled by the seeker`,
        type: 'session'
      });

      await emailService.sendSessionCancellation(professional.email, {
        firstName: professional.first_name,
        sessionDate: new Date(session.scheduled_at),
        seekerName: `${seeker.first_name} ${seeker.last_name}`,
        reason: req.body.reason || 'No reason provided'
      });
    } else {
      await notificationService.createNotification({
        userId: session.seeker_id,
        title: 'Session Cancelled',
        content: `Your session with ${professional.first_name} ${professional.last_name} scheduled for ${new Date(session.scheduled_at).toLocaleString()} has been cancelled`,
        type: 'session'
      });

      await emailService.sendSessionCancellation(seeker.email, {
        firstName: seeker.first_name,
        sessionDate: new Date(session.scheduled_at),
        professionalName: `${professional.first_name} ${professional.last_name}`,
        reason: req.body.reason || 'No reason provided'
      });
    }

    // Process refund if payment was made
    const payment = await PaymentModel.findBySessionId(id);
    if (payment && payment.status === 'completed') {
      // Check refund policy based on cancellation time
      const now = new Date();
      const sessionStart = new Date(session.scheduled_at);
      const hoursDifference = (sessionStart - now) / (1000 * 60 * 60);

      // If cancellation is more than 24 hours before the session, provide full refund
      // If professional cancels, always provide full refund
      if (hoursDifference >= 24 || initiator === 'professional') {
        // Process refund
        await PaymentModel.refund(payment.id);

        // Notify seeker about refund
        await notificationService.createNotification({
          userId: session.seeker_id,
          title: 'Payment Refunded',
          content: `Your payment for the cancelled session has been refunded`,
          type: 'payment'
        });
      }
    }

    // Return the cancelled session
    res.status(200).json({
      message: 'Session cancelled successfully',
      session: cancelledSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a session
 */
exports.completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the session
    const session = await SessionModel.findById(id);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Only professionals can mark sessions as completed
    if (session.professional_id !== userId) {
      throw new ForbiddenError('Only professionals can mark sessions as completed');
    }

    // Only allow completion of scheduled sessions
    if (session.status !== 'scheduled') {
      throw new BadRequestError(`Cannot complete session with status ${session.status}`);
    }

    // Check if session time has passed
    const now = new Date();
    const sessionEnd = new Date(session.scheduled_at);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + session.duration_minutes);

    if (now < sessionEnd) {
      throw new BadRequestError('Cannot complete a session before its scheduled end time');
    }

    // Complete the session
    const completedSession = await SessionModel.markAsCompleted(id);

    // Get participant details
    const seeker = await UserModel.findById(session.seeker_id);
    const professional = await UserModel.findById(session.professional_id);

    // Send notifications
    await notificationService.createNotification({
      userId: session.seeker_id,
      title: 'Session Completed',
      content: `Your session with ${professional.first_name} ${professional.last_name} has been marked as completed`,
      type: 'session'
    });

    await emailService.sendSessionFeedbackRequest(seeker.email, {
      firstName: seeker.first_name,
      sessionDate: new Date(session.scheduled_at),
      professionalName: `${professional.first_name} ${professional.last_name}`,
      feedbackLink: `${process.env.FRONTEND_URL}/sessions/${session.id}/feedback`
    });

    // Return the completed session
    res.status(200).json({
      message: 'Session marked as completed',
      session: completedSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a session as no-show
 */
exports.markNoShow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the session
    const session = await SessionModel.findById(id);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Only professionals can mark sessions as no-show
    if (session.professional_id !== userId) {
      throw new ForbiddenError('Only professionals can mark sessions as no-show');
    }

    // Only allow marking scheduled sessions as no-show
    if (session.status !== 'scheduled') {
      throw new BadRequestError(`Cannot mark session with status ${session.status} as no-show`);
    }

    // Check if at least 15 minutes have passed since the scheduled time
    const now = new Date();
    const sessionStart = new Date(session.scheduled_at);
    const minutesDifference = (now - sessionStart) / (1000 * 60);

    if (minutesDifference < 15) {
      throw new BadRequestError('Cannot mark as no-show until 15 minutes after the scheduled start time');
    }

    // Mark as no-show
    const noShowSession = await SessionModel.markAsNoShow(id);

    // Get participant details
    const seeker = await UserModel.findById(session.seeker_id);
    const professional = await UserModel.findById(session.professional_id);

    // Send notifications
    await notificationService.createNotification({
      userId: session.seeker_id,
      title: 'Session Marked as No-Show',
      content: `Your session with ${professional.first_name} ${professional.last_name} scheduled for ${new Date(session.scheduled_at).toLocaleString()} has been marked as a no-show`,
      type: 'session'
    });

    await emailService.sendNoShowNotification(seeker.email, {
      firstName: seeker.first_name,
      sessionDate: new Date(session.scheduled_at),
      professionalName: `${professional.first_name} ${professional.last_name}`
    });

    // Return the updated session
    res.status(200).json({
      message: 'Session marked as no-show',
      session: noShowSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add feedback to a session
 */
exports.addFeedback = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { feedback, rating } = req.body;

    // Find the session
    const session = await SessionModel.findById(id);
    
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Only seekers can add feedback
    if (session.seeker_id !== userId) {
      throw new ForbiddenError('Only seekers can add feedback to sessions');
    }

    // Only allow feedback for completed sessions
    if (session.status !== 'completed') {
      throw new BadRequestError(`Cannot add feedback to session with status ${session.status}`);
    }

    // Add feedback
    const updatedSession = await SessionModel.addFeedback(id, feedback, rating);

    // Get professional details
    const professional = await UserModel.findById(session.professional_id);

    // Send notification to professional
    await notificationService.createNotification({
      userId: session.professional_id,
      title: 'New Session Feedback',
      content: `You've received feedback for your session on ${new Date(session.scheduled_at).toLocaleString()}`,
      type: 'session'
    });

    await emailService.sendFeedbackNotification(professional.email, {
      firstName: professional.first_name,
      sessionDate: new Date(session.scheduled_at),
      rating: rating,
      feedbackUrl: `${process.env.FRONTEND_URL}/sessions/${session.id}/feedback`
    });

    // Return the updated session
    res.status(200).json({
      message: 'Feedback added successfully',
      session: updatedSession
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available time slots for a professional
 */
exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { professionalId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    // Check if professional exists
    const professional = await UserModel.findById(professionalId);
    if (!professional || professional.role !== 'professional') {
      throw new NotFoundError('Professional not found');
    }

    // Get available time slots
    const availableSlots = await SessionModel.getAvailableTimeSlots(
      professionalId,
      new Date(startDate),
      new Date(endDate)
    );

    // Return the available slots
    res.status(200).json({
      professional_id: professionalId,
      start_date: startDate,
      end_date: endDate,
      available_slots: availableSlots
    });
  } catch (error) {
    next(error);
  }
};
