const SessionService = require("../services/sessionService");
const ProfessionalService = require("../services/professionalService");
const PaymentService = require("../services/paymentService");
const ZoomService = require("../services/zoomService");
const responseFormatter = require("../utils/responseFormatter");
const { ValidationError, AuthorizationError } = require("../utils/errorTypes");
const logger = require("../utils/logger");

// Controller for session-related operations
const SessionController = {
  // Candidate submits a session request and pays a deposit
  requestSession: async (req, res, next) => {
    try {
      const { professionalId, availabilities, paymentMethodId, notes } = req.body;
      const userId = req.user.id;

      if (!professionalId || !Array.isArray(availabilities) || availabilities.length === 0) {
        throw new ValidationError('Professional ID and availabilities are required');
      }
      if (!paymentMethodId) {
        throw new ValidationError('Payment method ID is required');
      }

      const session = await SessionService.createSessionRequest({
        professionalId,
        userId,
        availabilities,
        notes,
      });

      await PaymentService.processSessionPayment(session._id, paymentMethodId, userId);

      return responseFormatter.created(res, { session }, 'Session request submitted');
    } catch (error) {
      next(error);
    }
  },
  // Create a new session
  createSession: async (req, res, next) => {
    try {
      const { professionalId, startTime, endTime, notes } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!professionalId || !startTime || !endTime) {
        throw new ValidationError(
          "Professional ID, start time, and end time are required",
        );
      }

      // Create session
      const session = await SessionService.createSession({
        professionalId,
        userId,
        startTime,
        endTime,
        notes,
      });

      return responseFormatter.created(
        res,
        {
          session,
        },
        "Session created successfully",
      );
    } catch (error) {
      next(error);
    }
  },

  // Get session by ID
  getSession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Include private data if user is part of the session
      const session = await SessionService.getSessionById(sessionId);

      // Check if user is authorized to view this session
      const isAuthorized =
        session.user._id.toString() === userId ||
        (session.professional.user &&
          session.professional.user._id.toString() === userId);

      if (!isAuthorized) {
        throw new AuthorizationError("Not authorized to view this session");
      }

      return responseFormatter.success(res, {
        session,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get sessions for current user
  getUserSessions: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const { status, limit = 10, page = 1 } = req.query;

      const { sessions, total } = await SessionService.getUserSessions(
        userId,
        status,
        parseInt(limit),
        parseInt(page),
      );

      return responseFormatter.paginated(
        res,
        sessions,
        parseInt(page),
        parseInt(limit),
        total,
        "Sessions retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  },

  // Get sessions for a professional
  getProfessionalSessions: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { status, limit = 10, page = 1 } = req.query;

      const professionalProfile = await ProfessionalService.getProfileByUserId(userId, true);

      const { sessions, total } = await SessionService.getProfessionalSessions(
        professionalProfile._id,
        status,
        parseInt(limit),
        parseInt(page),
      );

      return responseFormatter.paginated(
        res,
        sessions,
        parseInt(page),
        parseInt(limit),
        total,
        "Sessions retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  },

  // Update session status
  updateSessionStatus: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!status) {
        throw new ValidationError("Status is required");
      }

      // Get session
      const session = await SessionService.getSessionById(sessionId);

      // Check if user is authorized to update this session
      const isAuthorized =
        session.user._id.toString() === userId ||
        (session.professional.user &&
          session.professional.user._id.toString() === userId);

      if (!isAuthorized) {
        throw new AuthorizationError("Not authorized to update this session");
      }

      // Update status
      const updatedSession = await SessionService.updateSessionStatus(
        sessionId,
        status,
      );

      return responseFormatter.success(
        res,
        {
          session: updatedSession,
        },
        "Session status updated successfully",
      );
    } catch (error) {
      next(error);
    }
  },

  // Reschedule a session
  rescheduleSession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { startTime, endTime } = req.body;
      const userId = req.user.id;

      if (!startTime || !endTime) {
        throw new ValidationError("Start time and end time are required");
      }

      const session = await SessionService.getSessionById(sessionId);

      const isAuthorized =
        session.user._id.toString() === userId ||
        (session.professional.user &&
          session.professional.user._id.toString() === userId);

      if (!isAuthorized) {
        throw new AuthorizationError(
          "Not authorized to reschedule this session",
        );
      }

      const updatedSession = await SessionService.rescheduleSession(
        sessionId,
        startTime,
        endTime,
      );

      return responseFormatter.success(
        res,
        {
          session: updatedSession,
        },
        "Session rescheduled successfully",
      );
    } catch (error) {
      next(error);
    }
  },

  // Professional confirms a time for a requested session
  confirmSession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { startTime, endTime } = req.body;
      const userId = req.user.id;

      if (!startTime || !endTime) {
        throw new ValidationError('Start time and end time are required');
      }

      const session = await SessionService.getSessionById(sessionId);

      if (!session.professional.user || session.professional.user._id.toString() !== userId) {
        throw new AuthorizationError('Not authorized to confirm this session');
      }

      const updatedSession = await SessionService.confirmSessionTime(
        sessionId,
        startTime,
        endTime,
      );

      return responseFormatter.success(res, { session: updatedSession }, 'Session confirmed');
    } catch (error) {
      next(error);
    }
  },

  // Process payment for a session
  processPayment: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { paymentMethodId } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!paymentMethodId) {
        throw new ValidationError("Payment method ID is required");
      }

      // Get session
      const session = await SessionService.getSessionById(sessionId);

      // Check if user is authorized to pay for this session
      if (session.user._id.toString() !== userId) {
        throw new AuthorizationError("Not authorized to pay for this session");
      }

      // Process payment
      const paymentResult = await PaymentService.processSessionPayment(
        sessionId,
        paymentMethodId,
        userId,
      );

      return responseFormatter.success(
        res,
        {
          payment: paymentResult,
        },
        "Payment processed successfully",
      );
    } catch (error) {
      next(error);
    }
  },

  // Add candidate feedback (rating) to a session
addCandidateFeedback: async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating) {
      throw new ValidationError("Rating is required");
    }

    const session = await SessionService.addCandidateFeedback(
      sessionId,
      userId,
      rating,
      comment
    );

    return responseFormatter.success(res, { session }, "Feedback added successfully");
  } catch (error) {
    next(error);
  }
},

// Add professional feedback (text) to a session
addProfessionalFeedback: async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.id;

    if (!feedback || feedback.trim().length === 0) {
      throw new ValidationError("Feedback text is required");
    }

    const session = await SessionService.addProfessionalFeedback(
      sessionId,
      userId,
      rating,
      feedback
    );

    return responseFormatter.success(res, { session }, "Feedback submitted successfully");
  } catch (error) {
    next(error);
  }
},

  // Check professional availability for a time slot
  checkAvailability: async (req, res, next) => {
    try {
      const { professionalId, startTime, endTime } = req.body;

      // Validate required fields
      if (!professionalId || !startTime || !endTime) {
        throw new ValidationError(
          "Professional ID, start time, and end time are required",
        );
      }

      // Check availability
      const isAvailable = await SessionService.checkAvailability(
        professionalId,
        startTime,
        endTime,
      );

      return responseFormatter.success(res, {
        available: isAvailable,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = SessionController;
