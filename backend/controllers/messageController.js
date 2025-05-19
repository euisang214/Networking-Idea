const MessageService = require('../services/messageService');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthorizationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// Controller for message-related operations
const MessageController = {
  // Send a message
  sendMessage: async (req, res, next) => {
    try {
      const { recipientId, content, sessionId } = req.body;
      const senderId = req.user.id;
      
      // Validate required fields
      if (!recipientId || !content) {
        throw new ValidationError('Recipient ID and content are required');
      }
      
      // Send message
      const message = await MessageService.sendMessage(senderId, recipientId, content, sessionId);
      
      return responseFormatter.created(res, {
        message
      }, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Mark message as read
  markAsRead: async (req, res, next) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      
      // Mark as read
      const message = await MessageService.markAsRead(messageId, userId);
      
      return responseFormatter.success(res, {
        message
      }, 'Message marked as read');
    } catch (error) {
      next(error);
    }
  },
  
  // Get conversation between two users
  getConversation: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;
      const { limit = 50, skip = 0 } = req.query;
      
      // Get conversation
      const messages = await MessageService.getConversation(
        currentUserId,
        userId,
        parseInt(limit),
        parseInt(skip)
      );
      
      return responseFormatter.success(res, {
        messages
      }, 'Conversation retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get all conversations for a user
  getConversations: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get conversations
      const conversations = await MessageService.getConversations(userId);
      
      return responseFormatter.success(res, {
        conversations
      }, 'Conversations retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get unread message count
  getUnreadCount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get unread count
      const count = await MessageService.getUnreadCount(userId);
      
      return responseFormatter.success(res, {
        count
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get messages for a specific session
  getSessionMessages: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      // Get session messages
      const messages = await MessageService.getSessionMessages(sessionId, userId);
      
      return responseFormatter.success(res, {
        messages
      }, 'Session messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = MessageController;