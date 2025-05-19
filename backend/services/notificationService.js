const Notification = require('../models/notification');
const User = require('../models/user');
const logger = require('../utils/logger');

class NotificationService {
  // Send a notification to a user
  async sendNotification(userId, type, data) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const notification = new Notification({
        user: userId,
        type,
        data,
        read: false
      });
      
      await notification.save();
      
      // Emit real-time notification if socket is available
      if (global.io) {
        global.io.to(`user-${userId}`).emit('notification', notification);
      }
      
      logger.info(`Notification sent to user ${userId}: ${type}`);
      
      return notification;
    } catch (error) {
      logger.error(`Failed to send notification: ${error.message}`);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  // Get all notifications for a user
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      return await Notification.find({ user: userId })
                             .sort({ createdAt: -1 })
                             .skip(offset)
                             .limit(limit)
                             .exec();
    } catch (error) {
      logger.error(`Failed to get user notifications: ${error.message}`);
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  // Get unread notification count for a user
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ 
        user: userId,
        read: false
      });
    } catch (error) {
      logger.error(`Failed to get unread notification count: ${error.message}`);
      throw new Error(`Failed to get unread notification count: ${error.message}`);
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Verify user owns the notification
      if (notification.user.toString() !== userId) {
        throw new Error('Unauthorized to access this notification');
      }
      
      notification.read = true;
      notification.readAt = new Date();
      
      await notification.save();
      
      return notification;
    } catch (error) {
      logger.error(`Failed to mark notification as read: ${error.message}`);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all notifications for a user as read
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
      );
      
      logger.info(`Marked ${result.nModified} notifications as read for user ${userId}`);
      
      return {
        success: true,
        count: result.nModified
      };
    } catch (error) {
      logger.error(`Failed to mark all notifications as read: ${error.message}`);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Delete a notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Verify user owns the notification
      if (notification.user.toString() !== userId) {
        throw new Error('Unauthorized to delete this notification');
      }
      
      await notification.remove();
      
      logger.info(`Notification ${notificationId} deleted`);
      
      return {
        success: true,
        notificationId
      };
    } catch (error) {
      logger.error(`Failed to delete notification: ${error.message}`);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();