const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const authenticate = require('../middlewares/authenticate');
const { validators, validate } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// Send message
router.post('/', [
  validators.content,
  validate
], MessageController.sendMessage);

// Mark message as read
router.put('/:messageId/read', [
  validators.messageId,
  validate
], MessageController.markAsRead);

// Get conversation
router.get('/conversation/:userId', MessageController.getConversation);

// Get all conversations
router.get('/conversations', MessageController.getConversations);

// Get unread message count
router.get('/unread/count', MessageController.getUnreadCount);

// Get messages for a session
router.get('/session/:sessionId', [
  validators.sessionId,
  validate
], MessageController.getSessionMessages);

module.exports = router;