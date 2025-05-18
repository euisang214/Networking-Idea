/**
 * Notification controller
 */
const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const NotificationModel = require('../models/notification');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errorTypes');

/**
 * Get notifications for the current user
 */
exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, type, isRead } = req.query;
    
    // Convert isRead string to boolean if provided
    let isReadBool;
    if (isRead !== undefined) {
      isReadBool = isRead === 'true';
    }

    // Get notifications for the user
    const notificationsData = await NotificationModel.listForUser(userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      type,
      isRead: isReadBool
    });

    // Return notifications
    res.status(200).json(notificationsData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count for the current user
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get unread count
    const count = await notificationService.getUnreadCount(userId);

    // Return count
    res.status(200).json({
      unreadCount: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Mark notification as read
    try {
      const updatedNotification = await notificationService.markAsRead(id, userId);
      
      // Return updated notification
      res.status(200).json({
        message: 'Notification marked as read',
        notification: updatedNotification
      });
    } catch (error) {
      if (error.message === 'Notification not found') {
        throw new NotFoundError('Notification not found');
      } else if (error.message === 'Unauthorized access to notification') {
        throw new ForbiddenError('You are not authorized to access this notification');
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Mark all notifications as read
    const count = await notificationService.markAllAsRead(userId);

    // Return success
    res.status(200).json({
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Delete notification
    try {
      const success = await notificationService.deleteNotification(id, userId);
      
      if (!success) {
        throw new NotFoundError('Notification not found');
      }
      
      // Return success
      res.status(200).json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Notification not found') {
        throw new NotFoundError('Notification not found');
      } else if (error.message === 'Unauthorized access to notification') {
        throw new ForbiddenError('You are not authorized to access this notification');
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Send a notification to specific users
 */
exports.sendNotificationToUsers = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can send notifications to users');
    }

    const { userIds, title, content, type } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestError('userIds must be a non-empty array');
    }

    // Send notification to users
    const notifications = await notificationService.sendNotificationToUsers(userIds, {
      title,
      content,
      type: type || 'system'
    });

    // Return success
    res.status(201).json({
      message: `Notification sent to ${notifications.length} users`,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Send a system notification to all users
 */
exports.sendSystemNotification = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new BadRequestError('Validation error', errors.array());
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can send system notifications');
    }

    const { title, content } = req.body;

    // Send system notification
    const count = await notificationService.sendSystemNotification({
      title,
      content
    });

    // Return success
    res.status(201).json({
      message: `System notification sent to ${count} users`
    });
  } catch (error) {
    next(error);
  }
};
