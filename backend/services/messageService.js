const Message = require('../models/message');
const User = require('../models/user');
const Session = require('../models/session');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');

class MessageService {
  // Send a message
  async sendMessage(senderId, recipientId, content, sessionId = null, attachments = []) {
    try {
      // Validate sender and recipient
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error('Sender not found');
      }
      
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new Error('Recipient not found');
      }
      
      // Validate session if provided
      if (sessionId) {
        const session = await Session.findById(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        
        // Check if users are part of the session
        const isValidSession = 
          (session.professional.toString() === senderId && session.user.toString() === recipientId) ||
          (session.professional.toString() === recipientId && session.user.toString() === senderId);
          
        if (!isValidSession) {
          throw new Error('Users not associated with this session');
        }
      }
      
      // Create the message
      const message = new Message({
        sender: senderId,
        recipient: recipientId,
        content,
        session: sessionId,
        attachments
      });
      
      await message.save();
      
      // Send real-time notification if socket.io is available
      if (global.io) {
        global.io.to(`user-${recipientId}`).emit('new-message', {
          message,
          sender: {
            _id: sender._id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            profileImage: sender.profileImage
          }
        });
      }
      
      // Send notification
      await NotificationService.sendNotification(recipientId, 'newMessage', {
        messageId: message._id,
        senderId: senderId,
        senderName: `${sender.firstName} ${sender.lastName}`,
        preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });
      
      logger.info(`Message sent from ${senderId} to ${recipientId}`);
      
      return message;
    } catch (error) {
      logger.error(`Failed to send message: ${error.message}`);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Mark message as read
  async markAsRead(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Verify recipient is marking the message as read
      if (message.recipient.toString() !== userId) {
        throw new Error('Unauthorized to mark this message as read');
      }
      
      // Update message
      message.read = true;
      message.readAt = new Date();
      await message.save();
      
      // Send real-time notification to sender
      if (global.io) {
        global.io.to(`user-${message.sender}`).emit('message-read', {
          messageId: message._id,
          readAt: message.readAt
        });
      }
      
      logger.info(`Message ${messageId} marked as read by ${userId}`);
      
      return message;
    } catch (error) {
      logger.error(`Failed to mark message as read: ${error.message}`);
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  // Get conversation between two users
  async getConversation(user1Id, user2Id, limit = 50, skip = 0) {
    try {
      const messages = await Message.getConversation(user1Id, user2Id, limit, skip);
      
      // Mark all unread messages as read if they're sent to user1
      await Message.updateMany(
        { 
          sender: user2Id, 
          recipient: user1Id, 
          read: false 
        },
        { 
          read: true, 
          readAt: new Date() 
        }
      );
      
      return messages;
    } catch (error) {
      logger.error(`Failed to get conversation: ${error.message}`);
      throw new Error(`Failed to get conversation: ${error.message}`);
    }
  }

  // Get all conversations for a user
  async getConversations(userId) {
    try {
      return await Message.getConversations(userId);
    } catch (error) {
      logger.error(`Failed to get conversations: ${error.message}`);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  // Get unread message count for a user
  async getUnreadCount(userId) {
    try {
      return await Message.countDocuments({
        recipient: userId,
        read: false
      });
    } catch (error) {
      logger.error(`Failed to get unread count: ${error.message}`);
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  // Get messages for a specific session
  async getSessionMessages(sessionId, userId) {
    try {
      const session = await Session.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Verify user is part of the session
      if (session.professional.toString() !== userId && session.user.toString() !== userId) {
        throw new Error('Unauthorized to access session messages');
      }
      
      // Get the other user ID
      const otherUserId = session.professional.toString() === userId ? 
                         session.user.toString() : 
                         session.professional.toString();
      
      // Get messages between the users for this session
      const messages = await Message.find({ session: sessionId })
                                  .sort({ createdAt: 1 })
                                  .populate('sender', 'firstName lastName profileImage')
                                  .exec();
      
      // Mark all unread messages as read if they're sent to the user
      await Message.updateMany(
        { 
          sender: otherUserId, 
          recipient: userId, 
          session: sessionId,
          read: false 
        },
        { 
          read: true, 
          readAt: new Date() 
        }
      );
      
      return messages;
    } catch (error) {
      logger.error(`Failed to get session messages: ${error.message}`);
      throw new Error(`Failed to get session messages: ${error.message}`);
    }
  }
}

module.exports = new MessageService();