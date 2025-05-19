const NotificationService = require('../services/notificationService');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError, AuthorizationError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// Controller for notification-related operations
const NotificationController = {
  // Get all notifications for a user
  getNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;
      
      // Get notifications
      const notifications = await NotificationService.getUserNotifications(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
      
      return responseFormatter.success(res, {
        notifications
      }, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
  
  // Get unread notification count
  getUnreadCount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Get unread count
      const count = await NotificationService.getUnreadCount(userId);
      
      return responseFormatter.success(res, {
        count
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Mark a notification as read
  markAsRead: async (req, res, next) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;
      
      // Mark as read
      const notification = await NotificationService.markAsRead(notificationId, userId);
      
      return responseFormatter.success(res, {
        notification
      }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Mark all as read
      const result = await NotificationService.markAllAsRead(userId);
      
      return responseFormatter.success(res, {
        count: result.count
      }, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  },
  
  // Delete a notification
  deleteNotification: async (req, res, next) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;
      
      // Delete notification
      const result = await NotificationService.deleteNotification(notificationId, userId);
      
      return responseFormatter.success(res, {
        notificationId: result.notificationId
      }, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = NotificationController;