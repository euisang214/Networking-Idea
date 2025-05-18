/**
 * Notification model
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../utils/errorTypes');

class Notification {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Object} Created notification object
   */
  static async create(notificationData) {
    // Generate a UUID if not provided
    const id = notificationData.id || uuidv4();
    
    // Insert the notification into the database
    const [notification] = await db('notifications')
      .insert({
        id,
        user_id: notificationData.user_id,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type || 'system',
        is_read: notificationData.is_read || false
      })
      .returning('*');
    
    return notification;
  }

  /**
   * Find a notification by ID
   * @param {string} id - Notification ID
   * @returns {Object|null} Notification object or null if not found
   */
  static async findById(id) {
    const notification = await db('notifications')
      .where({ id })
      .first();
    
    return notification || null;
  }

  /**
   * Update a notification
   * @param {string} id - Notification ID
   * @param {Object} notificationData - Notification data to update
   * @returns {Object} Updated notification object
   */
  static async update(id, notificationData) {
    // Check if notification exists
    const existingNotification = await this.findById(id);
    
    if (!existingNotification) {
      throw new NotFoundError('Notification not found');
    }
    
    // Create update object
    const updateData = {};
    
    // Only include fields that are provided
    if (notificationData.title !== undefined) updateData.title = notificationData.title;
    if (notificationData.content !== undefined) updateData.content = notificationData.content;
    if (notificationData.type !== undefined) updateData.type = notificationData.type;
    if (notificationData.is_read !== undefined) updateData.is_read = notificationData.is_read;
    
    // Update the notification
    const [updatedNotification] = await db('notifications')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return updatedNotification;
  }

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   * @returns {boolean} True if deleted, false if not found
   */
  static async delete(id) {
    const count = await db('notifications')
      .where({ id })
      .delete();
    
    return count > 0;
  }

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   * @returns {Object} Updated notification object
   */
  static async markAsRead(id) {
    // Check if notification exists
    const existingNotification = await this.findById(id);
    
    if (!existingNotification) {
      throw new NotFoundError('Notification not found');
    }
    
    if (existingNotification.is_read) {
      return existingNotification; // Already read
    }
    
    // Update the notification
    const [updatedNotification] = await db('notifications')
      .where({ id })
      .update({ is_read: true })
      .returning('*');
    
    return updatedNotification;
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {number} Number of updated notifications
   */
  static async markAllAsRead(userId) {
    const count = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });
    
    return count;
  }

  /**
   * List notifications for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Pagination and filter options
   * @returns {Object} Object with notifications array and pagination info
   */
  static async listForUser(userId, {
    page = 1,
    limit = 20,
    type,
    isRead
  }) {
    // Start building the query
    let query = db('notifications').where({ user_id: userId });
    
    // Apply filters
    if (type) {
      query = query.where('type', type);
    }
    
    if (isRead !== undefined) {
      query = query.where('is_read', isRead);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('created_at', 'desc').offset(offset).limit(limit);
    
    // Execute query
    const notifications = await query;
    
    // Get total count for pagination
    const [{ count }] = await db('notifications')
      .where({ user_id: userId })
      .modify(function(queryBuilder) {
        if (type) {
          queryBuilder.where('type', type);
        }
        
        if (isRead !== undefined) {
          queryBuilder.where('is_read', isRead);
        }
      })
      .count('id');
    
    return {
      notifications,
      pagination: {
        total: parseInt(count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(count, 10) / limit)
      }
    };
  }

  /**
   * Count unread notifications for a user
   * @param {string} userId - User ID
   * @returns {number} Count of unread notifications
   */
  static async countUnread(userId) {
    const [{ count }] = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .count('id');
    
    return parseInt(count, 10);
  }

  /**
   * Delete old notifications
   * @param {number} days - Number of days to keep notifications
   * @returns {number} Number of deleted notifications
   */
  static async deleteOld(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const count = await db('notifications')
      .where('created_at', '<', cutoffDate)
      .delete();
    
    return count;
  }
}

module.exports = Notification;
