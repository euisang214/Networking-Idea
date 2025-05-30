const express = require("express");
const router = express.Router();
const SessionController = require("../controllers/sessionController");
const authenticate = require("../middlewares/authenticate");
const { validate, schemas } = require("../utils/validation");
const { validators } = schemas;

// All routes require authentication
router.use(authenticate);

// Submit session request
router.post('/request', SessionController.requestSession);

// Create session
router.post(
  '/',
  validate([validators.startTime, validators.endTime]),
  SessionController.createSession
);

// Get session by ID
router.get(
  '/:sessionId',
  validate(validators.sessionId),
  SessionController.getSession
);

// Get sessions for current user
router.get("/user/me", SessionController.getUserSessions);

// Get sessions for professional
router.get("/professional/me", SessionController.getProfessionalSessions);

// Update session status
router.put(
  '/:sessionId/status',
  validate(validators.sessionId),
  SessionController.updateSessionStatus
);

// Reschedule session
router.put(
  '/:sessionId/reschedule',
  validate([validators.sessionId, validators.startTime, validators.endTime]),
  SessionController.rescheduleSession
);

// Confirm session time
router.post(
  '/:sessionId/confirm',
  validate([validators.sessionId, validators.startTime, validators.endTime]),
  SessionController.confirmSession
);

// Process payment for session
router.post(
  '/:sessionId/payment',
  validate(validators.sessionId),
  SessionController.processPayment
);

// Candidate feedback
router.post(
  '/:sessionId/feedback/candidate',
  validate([validators.sessionId, validators.rating]),
  SessionController.addCandidateFeedback
);

// Professional feedback
router.post(
  '/:sessionId/feedback/professional',
  validate(validators.sessionId),
  SessionController.addProfessionalFeedback
);

// Check professional availability
router.post("/check-availability", SessionController.checkAvailability);

module.exports = router;
