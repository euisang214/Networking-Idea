const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const authenticate = require('../middlewares/authenticate');
const { validate, schemas } = require('../utils/validation');
const { validators } = schemas;

// All routes require authentication
router.use(authenticate);

// Send message
router.post('/',
  validate(validators.content),
  MessageController.sendMessage
);

// Mark message as read
router.put(
  '/:messageId/read',
  validate(validators.messageId),
  MessageController.markAsRead
);

// Get conversation
router.get('/conversation/:userId', MessageController.getConversation);

// Get all conversations
router.get('/conversations', MessageController.getConversations);

// Get unread message count
router.get('/unread/count', MessageController.getUnreadCount);

// Get messages for a session
router.get(
  '/session/:sessionId',
  validate(validators.sessionId),
  MessageController.getSessionMessages
);

module.exports = router;