const Session = require('../models/session');
const User = require('../models/user');
const ProfessionalProfile = require('../models/professionalProfile');
const NotificationService = require('./notificationService');
const ZoomService = require('./zoomService');
const logger = require('../utils/logger');

class SessionService {
  // Create a new session
  async createSession(sessionData) {
    try {
      const { professionalId, userId, startTime, endTime, notes } = sessionData;
      
      // Validate professional and user
      const professional = await ProfessionalProfile.findById(professionalId).populate('user');
      if (!professional) {
        throw new Error('Professional not found');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check professional availability
      const isAvailable = await this.checkAvailability(professionalId, startTime, endTime);
      if (!isAvailable) {
        throw new Error('Professional is not available during this time slot');
      }
      
      // Calculate session price based on professional's hourly rate
      const durationHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
      const price = Math.round(professional.hourlyRate * durationHours);
      
      // Create Zoom meeting
      const zoomMeeting = await ZoomService.createMeeting(
        { startTime, endTime, _id: 'temp' }, // Temporary session object for Zoom service
        professional,
        user
      );
      
      // Create session
      const session = new Session({
        professional: professionalId,
        user: userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'scheduled',
        paymentStatus: 'pending',
        price,
        zoomMeetingId: zoomMeeting.meetingId,
        zoomMeetingUrl: zoomMeeting.meetingUrl,
        zoomMeetingPassword: zoomMeeting.password,
        notes
      });
      
      await session.save();
      
      // Send notifications
      await NotificationService.sendNotification(userId, 'sessionCreated', {
        sessionId: session._id,
        professionalName: professional.anonymizedProfile.displayName,
        startTime
      });
      
      await NotificationService.sendNotification(professional.user._id, 'newSession', {
        sessionId: session._id,
        userName: `${user.firstName} ${user.lastName}`,
        startTime
      });
      
      logger.info(`Session created: ${session._id} between professional ${professionalId} and user ${userId}`);
      
      return session;
    } catch (error) {
      logger.error(`Failed to create session: ${error.message}`);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  // Find session by ID with populated relationships
  async getSessionById(sessionId, includePrivateData = false) {
    try {
      const query = Session.findById(sessionId)
                          .populate('user', '-password')
                          .populate({
                            path: 'professional',
                            populate: {
                              path: 'user',
                              select: includePrivateData ? '-password' : 'firstName lastName' 
                            }
                          });
      
      const session = await query.exec();
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      return session;
    } catch (error) {
      logger.error(`Failed to get session: ${error.message}`);
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  // Find sessions for a specific user
  async getUserSessions(userId) {
    try {
      return await Session.find({ user: userId })
                         .populate('professional')
                         .sort({ startTime: -1 })
                         .exec();
    } catch (error) {
      logger.error(`Failed to get user sessions: ${error.message}`);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  // Find sessions for a specific professional
  async getProfessionalSessions(professionalId) {
    try {
      return await Session.find({ professional: professionalId })
                         .populate('user', '-password')
                         .sort({ startTime: -1 })
                         .exec();
    } catch (error) {
      logger.error(`Failed to get professional sessions: ${error.message}`);
      throw new Error(`Failed to get professional sessions: ${error.message}`);
    }
  }

  // Update session status
  async updateSessionStatus(sessionId, status) {
    try {
      const session = await Session.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      session.status = status;
      
      if (status === 'cancelled') {
        // Handle cancellation logic
        // Add refund logic if needed
      }
      
      await session.save();
      
      // Send notifications
      await NotificationService.sendNotification(session.user, 'sessionStatusChanged', {
        sessionId: session._id,
        status
      });
      
      await NotificationService.sendNotification(session.professional, 'sessionStatusChanged', {
        sessionId: session._id,
        status
      });
      
      logger.info(`Session ${sessionId} status updated to ${status}`);
      
      return session;
    } catch (error) {
      logger.error(`Failed to update session status: ${error.message}`);
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  // Check if a professional is available during a specific time slot
  async checkAvailability(professionalId, startTime, endTime) {
    try {
      const professional = await ProfessionalProfile.findById(professionalId);
      
      if (!professional) {
        throw new Error('Professional not found');
      }
      
      // Convert to Date objects
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      // Check if time slot falls within professional's availability
      const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const availableDay = professional.availability.find(a => a.day === dayOfWeek);
      
      if (!availableDay) {
        return false;
      }
      
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      
      const availableStartHour = parseInt(availableDay.startTime.split(':')[0]) +
                               parseInt(availableDay.startTime.split(':')[1]) / 60;
      const availableEndHour = parseInt(availableDay.endTime.split(':')[0]) +
                             parseInt(availableDay.endTime.split(':')[1]) / 60;
      
      if (startHour < availableStartHour || endHour > availableEndHour) {
        return false;
      }
      
      // Check if there are any overlapping sessions
      const overlappingSessions = await Session.countDocuments({
        professional: professionalId,
        status: { $nin: ['cancelled', 'no-show'] },
        $or: [
          // Session starts during the requested slot
          {
            startTime: { $gte: start, $lt: end }
          },
          // Session ends during the requested slot
          {
            endTime: { $gt: start, $lte: end }
          },
          // Session encompasses the requested slot
          {
            startTime: { $lte: start },
            endTime: { $gte: end }
          }
        ]
      });
      
      return overlappingSessions === 0;
    } catch (error) {
      logger.error(`Failed to check availability: ${error.message}`);
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  // Find a session by Zoom meeting ID
  async findByZoomMeetingId(meetingId) {
    try {
      return await Session.findOne({ zoomMeetingId: meetingId });
    } catch (error) {
      logger.error(`Failed to find session by Zoom meeting ID: ${error.message}`);
      throw new Error(`Failed to find session by Zoom meeting ID: ${error.message}`);
    }
  }

  // Mark session as verified after Zoom meeting confirmation
  async markAsVerified(sessionId, meetingDetails) {
    try {
      const session = await Session.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      await session.markAsVerified(
        meetingDetails.duration,
        meetingDetails.participantCount
      );
      
      logger.info(`Session ${sessionId} marked as verified`);
      
      return session;
    } catch (error) {
      logger.error(`Failed to mark session as verified: ${error.message}`);
      throw new Error(`Failed to mark session as verified: ${error.message}`);
    }
  }

  // Add feedback to a session
  async addFeedback(sessionId, userId, rating, comment) {
    try {
      const session = await Session.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Verify user is authorized to add feedback
      if (session.user.toString() !== userId) {
        throw new Error('Unauthorized to add feedback to this session');
      }
      
      session.feedback = {
        rating,
        comment,
        providedAt: new Date()
      };
      
      await session.save();
      
      // Update professional's average rating
      const professional = await ProfessionalProfile.findById(session.professional);
      await professional.updateStatistics();
      
      logger.info(`Feedback added to session ${sessionId}`);
      
      return session;
    } catch (error) {
      logger.error(`Failed to add feedback: ${error.message}`);
      throw new Error(`Failed to add feedback: ${error.message}`);
    }
  }
}

module.exports = new SessionService();