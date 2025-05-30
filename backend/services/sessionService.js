const Session = require("../models/session");
const SessionVerification = require("../models/sessionVerification");
const User = require("../models/user");
const ProfessionalProfile = require("../models/professionalProfile");
const NotificationService = require("./notificationService");
const ZoomService = require("./zoomService");
const EmailService = require("./emailService");
const logger = require("../utils/logger");

class SessionService {
  // Create a new session
  async createSession(sessionData) {
    try {
      const { professionalId, userId, startTime, endTime, notes } = sessionData;

      // Validate professional and user
      const professional =
        await ProfessionalProfile.findById(professionalId).populate("user");
      if (!professional) {
        throw new Error("Professional not found");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check professional availability
      const isAvailable = await this.checkAvailability(
        professionalId,
        startTime,
        endTime,
      );
      if (!isAvailable) {
        throw new Error("Professional is not available during this time slot");
      }

      // Calculate session price based on professional's hourly rate
      const durationHours =
        (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
      const price = Math.round(professional.hourlyRate * durationHours);

      // Create Zoom meeting
      const zoomMeeting = await ZoomService.createMeeting(
        { startTime, endTime, _id: "temp" }, // Temporary session object for Zoom service
        professional,
        user,
      );

      // Create session
      const session = new Session({
        professional: professionalId,
        user: userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "scheduled",
        paymentStatus: "pending",
        price,
        zoomMeetingId: zoomMeeting.meetingId,
        zoomMeetingUrl: zoomMeeting.meetingUrl,
        zoomMeetingPassword: zoomMeeting.password,
        notes,
      });

      await session.save();

      // Send notifications
      await NotificationService.sendNotification(userId, "sessionCreated", {
        sessionId: session._id,
        professionalName: `${professional.user.firstName} ${professional.user.lastName}`,
        startTime,
      });

      await NotificationService.sendNotification(
        professional.user._id,
        "newSession",
        {
          sessionId: session._id,
          userName: `${user.firstName} ${user.lastName}`,
          startTime,
        },
      );

      // Send confirmation emails
      await EmailService.sendSessionConfirmation(session, professional, user);

      logger.info(
        `Session created: ${session._id} between professional ${professionalId} and user ${userId}`,
      );

      return session;
    } catch (error) {
      logger.error(`Failed to create session: ${error.message}`);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  // Create a new session request without a confirmed time
  async createSessionRequest({ professionalId, userId, availabilities, notes }) {
    try {
      const professional = await ProfessionalProfile.findById(professionalId).populate('user');
      if (!professional) {
        throw new Error('Professional not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const defaultDuration =
        (professional.sessionSettings && professional.sessionSettings.defaultSessionLength) || 30;
      const price = Math.round((professional.hourlyRate * defaultDuration) / 60);

      const session = new Session({
        professional: professionalId,
        user: userId,
        status: 'requested',
        paymentStatus: 'pending',
        price,
        candidateAvailabilities: availabilities,
        notes,
      });

      await session.save();

      await NotificationService.sendNotification(professional.user._id, 'newSessionRequest', {
        sessionId: session._id,
        userName: `${user.firstName} ${user.lastName}`,
      });

      logger.info(`Session request ${session._id} created for professional ${professionalId}`);

      return session;
    } catch (error) {
      logger.error(`Failed to create session request: ${error.message}`);
      throw new Error(`Failed to create session request: ${error.message}`);
    }
  }

  // Find session by ID with populated relationships
  async getSessionById(sessionId, includePrivateData = false) {
    try {
      const query = Session.findById(sessionId)
        .populate("user", "-password")
        .populate({
          path: "professional",
          populate: {
            path: "user",
            select: includePrivateData ? "-password" : "firstName lastName",
          },
        });

      const session = await query.exec();

      if (!session) {
        throw new Error("Session not found");
      }

      return session;
    } catch (error) {
      logger.error(`Failed to get session: ${error.message}`);
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  // Find sessions for a specific user with optional pagination
  async getUserSessions(userId, status = null, limit = 10, page = 1) {
    try {
      const filter = { user: userId };
      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const [sessions, total] = await Promise.all([
        Session.find(filter)
          .populate("professional")
          .sort({ startTime: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        Session.countDocuments(filter)
      ]);

      return { sessions, total };
    } catch (error) {
      logger.error(`Failed to get user sessions: ${error.message}`);
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  // Find sessions for a specific professional with optional pagination
  async getProfessionalSessions(professionalId, status = null, limit = 10, page = 1) {
    try {
      const filter = { professional: professionalId };
      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const [sessions, total] = await Promise.all([
        Session.find(filter)
          .populate("user", "-password")
          .sort({ startTime: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        Session.countDocuments(filter)
      ]);

      return { sessions, total };
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
        throw new Error("Session not found");
      }

      session.status = status;

      if (status === "cancelled") {
        // Handle cancellation logic
        // Add refund logic if needed
      }

      await session.save();

      // Send notifications
      await NotificationService.sendNotification(
        session.user,
        "sessionStatusChanged",
        {
          sessionId: session._id,
          status,
        },
      );

      await NotificationService.sendNotification(
        session.professional,
        "sessionStatusChanged",
        {
          sessionId: session._id,
          status,
        },
      );

      logger.info(`Session ${sessionId} status updated to ${status}`);

      return session;
    } catch (error) {
      logger.error(`Failed to update session status: ${error.message}`);
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  // Reschedule session
  async rescheduleSession(sessionId, startTime, endTime) {
    try {
      const session = await Session.findById(sessionId)
        .populate("professional")
        .populate("user");

      if (!session) {
        throw new Error("Session not found");
      }

      const isAvailable = await this.checkAvailability(
        session.professional._id,
        startTime,
        endTime,
      );
      if (!isAvailable) {
        throw new Error("Professional is not available during this time slot");
      }

      session.startTime = new Date(startTime);
      session.endTime = new Date(endTime);

      if (session.zoomMeetingId) {
        try {
          await ZoomService.updateMeeting(
            session.zoomMeetingId,
            session,
            session.professional,
            session.user,
          );
        } catch (err) {
          logger.error(`Failed to update Zoom meeting: ${err.message}`);
        }
      }

      await session.save();

      await NotificationService.sendNotification(
        session.user._id,
        "sessionRescheduled",
        {
          sessionId: session._id,
          startTime,
        },
      );
      await NotificationService.sendNotification(
        session.professional.user,
        "sessionRescheduled",
        {
          sessionId: session._id,
          startTime,
        },
      );

      logger.info(`Session ${sessionId} rescheduled`);

      return session;
    } catch (error) {
      logger.error(`Failed to reschedule session: ${error.message}`);
      throw new Error(`Failed to reschedule session: ${error.message}`);
    }
  }

  // Confirm a requested session time and create the Zoom meeting
  async confirmSessionTime(sessionId, startTime, endTime) {
    try {
      const session = await Session.findById(sessionId)
        .populate('professional')
        .populate('user');

      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status !== 'requested') {
        throw new Error('Session is already scheduled');
      }

      const isAvailable = await this.checkAvailability(
        session.professional._id,
        startTime,
        endTime,
      );
      if (!isAvailable) {
        throw new Error('Professional is not available during this time slot');
      }

      const zoomMeeting = await ZoomService.createMeeting(
        { startTime, endTime, _id: session._id },
        session.professional,
        session.user,
      );

      session.startTime = new Date(startTime);
      session.endTime = new Date(endTime);
      session.status = 'scheduled';
      session.zoomMeetingId = zoomMeeting.meetingId;
      session.zoomMeetingUrl = zoomMeeting.meetingUrl;
      session.zoomMeetingPassword = zoomMeeting.password;

      await session.save();

      await NotificationService.sendNotification(session.user._id, 'sessionConfirmed', {
        sessionId: session._id,
        startTime,
      });
      await NotificationService.sendNotification(session.professional.user, 'sessionConfirmed', {
        sessionId: session._id,
        startTime,
      });

      await EmailService.sendSessionConfirmation(session, session.professional, session.user);

      logger.info(`Session ${sessionId} confirmed and scheduled`);

      return session;
    } catch (error) {
      logger.error(`Failed to confirm session time: ${error.message}`);
      throw new Error(`Failed to confirm session time: ${error.message}`);
    }
  }

  // Check if a professional is available during a specific time slot
  async checkAvailability(professionalId, startTime, endTime) {
    try {
      const professional = await ProfessionalProfile.findById(professionalId);

      if (!professional) {
        throw new Error("Professional not found");
      }

      // Convert to Date objects
      const start = new Date(startTime);
      const end = new Date(endTime);

      // Check if time slot falls within professional's availability
      const dayOfWeek = start.toLocaleDateString("en-US", {
        weekday: "lowercase",
      });
      const availableDay = professional.availability.find(
        (a) => a.day === dayOfWeek,
      );

      if (!availableDay) {
        return false;
      }

      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;

      const availableStartHour =
        parseInt(availableDay.startTime.split(":")[0]) +
        parseInt(availableDay.startTime.split(":")[1]) / 60;
      const availableEndHour =
        parseInt(availableDay.endTime.split(":")[0]) +
        parseInt(availableDay.endTime.split(":")[1]) / 60;

      if (startHour < availableStartHour || endHour > availableEndHour) {
        return false;
      }

      // Check if there are any overlapping sessions
      const overlappingSessions = await Session.countDocuments({
        professional: professionalId,
        status: { $nin: ["cancelled", "no-show"] },
        $or: [
          // Session starts during the requested slot
          {
            startTime: { $gte: start, $lt: end },
          },
          // Session ends during the requested slot
          {
            endTime: { $gt: start, $lte: end },
          },
          // Session encompasses the requested slot
          {
            startTime: { $lte: start },
            endTime: { $gte: end },
          },
        ],
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
      logger.error(
        `Failed to find session by Zoom meeting ID: ${error.message}`,
      );
      throw new Error(
        `Failed to find session by Zoom meeting ID: ${error.message}`,
      );
    }
  }

  // Mark session as verified after Zoom meeting confirmation
  async markAsVerified(sessionId, meetingDetails) {
    try {
      const session = await Session.findById(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      await session.markAsVerified(
        meetingDetails.duration,
        meetingDetails.participantCount,
      );

      await SessionVerification.create({
        session: session._id,
        verified: true,
        method: meetingDetails.method || "manual",
        meetingDuration: meetingDetails.duration,
        participantCount: meetingDetails.participantCount,
      });

      logger.info(`Session ${sessionId} marked as verified`);

      return session;
    } catch (error) {
      logger.error(`Failed to mark session as verified: ${error.message}`);
      throw new Error(`Failed to mark session as verified: ${error.message}`);
    }
  }

  // Add candidate feedback to a session
  async addCandidateFeedback(sessionId, userId, rating, comment) {
    try {
      const session = await Session.findById(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      // Verify user is authorized to add feedback
      if (session.user.toString() !== userId) {
        throw new Error("Unauthorized to add feedback to this session");
      }

      if (!session.feedback) {
        session.feedback = {};
      }

      session.feedback.candidateRating = rating;
      session.feedback.candidateComment = comment;
      session.feedback.candidateProvidedAt = new Date();

      await session.save();

      // Update professional's average rating
      const professional = await ProfessionalProfile.findById(session.professional);
      await professional.updateStatistics();

      logger.info(`Candidate feedback added to session ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Failed to add candidate feedback: ${error.message}`);
      throw new Error(`Failed to add candidate feedback: ${error.message}`);
    }
  }

  // Add professional feedback to a session
  async addProfessionalFeedback(sessionId, userId, feedback) {
    try {
      const session = await Session.findById(sessionId)
        .populate('professional')
        .populate('user');

      if (!session) {
        throw new Error("Session not found");
      }

      // Verify user is authorized to add feedback
      if (session.professional.user.toString() !== userId) {
        throw new Error("Unauthorized to add feedback to this session");
      }

      if (!session.feedback) {
        session.feedback = {};
      }

      session.feedback.professionalFeedback = feedback;
      session.feedback.professionalProvidedAt = new Date();

      await session.save();

      // **CRITICAL: Release payment to professional after feedback submission**
      if (session.paymentStatus === 'paid') {
        try {
          const PaymentService = require('./paymentService');
          await PaymentService.releaseSessionPayment(sessionId);
          logger.info(`Payment released for session ${sessionId} after professional feedback`);
        } catch (paymentError) {
          logger.error(`Failed to release payment after feedback: ${paymentError.message}`);
        }
      }

      // Show offer bonus potential to professional
      const NotificationService = require('./notificationService');
      await NotificationService.sendNotification(userId, 'feedbackSubmitted', {
        sessionId: session._id,
        candidateName: `${session.user.firstName} ${session.user.lastName}`,
        offerBonusAmount: session.user.offerBonusAmount
      });

      logger.info(`Professional feedback added to session ${sessionId}`);
      return session;
    } catch (error) {
      logger.error(`Failed to add professional feedback: ${error.message}`);
      throw new Error(`Failed to add professional feedback: ${error.message}`);
    }
  }
}

module.exports = new SessionService();
