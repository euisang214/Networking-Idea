/**
 * Notification service
 */
const NotificationModel = require('../models/notification');
const logger = require('../utils/logger');

/**
 * Create a notification
 * @param {Object} notificationData - Notification data
 * @returns {Object} Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await NotificationModel.create(notificationData);
    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
};

/**
 * Send a notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data without user_id
 * @returns {Array<Object>} Array of created notifications
 */
exports.sendNotificationToUsers = async (userIds, notificationData) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await NotificationModel.create({
        user_id: userId,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type || 'system'
      });
      
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    logger.error('Failed to send notifications to users:', error);
    throw error;
  }
};

/**
 * Send a system notification to all users
 * @param {Object} notificationData - Notification data
 * @returns {number} Number of created notifications
 */
exports.sendSystemNotification = async (notificationData) => {
  try {
    // Get all user IDs
    const userIds = await require('../models/user').getAllUserIds();
    
    let count = 0;
    
    for (const userId of userIds) {
      await NotificationModel.create({
        user_id: userId,
        title: notificationData.title,
        content: notificationData.content,
        type: 'system'
      });
      
      count++;
    }
    
    return count;
  } catch (error) {
    logger.error('Failed to send system notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Object} Updated notification
 */
exports.markAsRead = async (notificationId, userId) => {
  try {
    // Check if notification belongs to user
    const notification = await NotificationModel.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    if (notification.user_id !== userId) {
      throw new Error('Unauthorized access to notification');
    }
    
    const updatedNotification = await NotificationModel.markAsRead(notificationId);
    return updatedNotification;
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {number} Number of updated notifications
 */
exports.markAllAsRead = async (userId) => {
  try {
    const count = await NotificationModel.markAllAsRead(userId);
    return count;
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {boolean} True if deleted, false if not found
 */
exports.deleteNotification = async (notificationId, userId) => {
  try {
    // Check if notification belongs to user
    const notification = await NotificationModel.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    if (notification.user_id !== userId) {
      throw new Error('Unauthorized access to notification');
    }
    
    const success = await NotificationModel.delete(notificationId);
    return success;
  } catch (error) {
    logger.error('Failed to delete notification:', error);
    throw error;
  }
};

/**
 * Get unread count for a user
 * @param {string} userId - User ID
 * @returns {number} Count of unread notifications
 */
exports.getUnreadCount = async (userId) => {
  try {
    const count = await NotificationModel.countUnread(userId);
    return count;
  } catch (error) {
    logger.error('Failed to get unread count:', error);
    throw error;
  }
};

/**
 * Clean up old notifications
 * @param {number} days - Number of days to keep notifications
 * @returns {number} Number of deleted notifications
 */
exports.cleanupOldNotifications = async (days = 30) => {
  try {
    const count = await NotificationModel.deleteOld(days);
    logger.info(`Deleted ${count} old notifications`);
    return count;
  } catch (error) {
    logger.error('Failed to clean up old notifications:', error);
    throw error;
  }
};
