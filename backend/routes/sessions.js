const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const authenticate = require('../middlewares/authenticate');
const { validators, validate } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Create session
router.post('/', [
  validators.startTime,
  validators.endTime,
  validate
], SessionController.createSession);

// Get session by ID
router.get('/:sessionId', [
  validators.sessionId,
  validate
], SessionController.getSession);

// Get sessions for current user
router.get('/user/me', SessionController.getUserSessions);

// Get sessions for professional
router.get('/professional/me', SessionController.getProfessionalSessions);

// Update session status
router.put('/:sessionId/status', [
  validators.sessionId,
  validate
], SessionController.updateSessionStatus);

// Process payment for session
router.post('/:sessionId/payment', [
  validators.sessionId,
  validate
], SessionController.processPayment);

// Add feedback to session
router.post('/:sessionId/feedback', [
  validators.sessionId,
  validators.rating,
  validate
], SessionController.addFeedback);

// Check professional availability
router.post('/check-availability', SessionController.checkAvailability);

module.exports = router;