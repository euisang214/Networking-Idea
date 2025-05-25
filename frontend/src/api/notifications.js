import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const NotificationsAPI = {
  /**
   * Retrieve notifications
   * @param {number} limit - Maximum number of records
   * @param {number} offset - Starting index
   * @returns {Promise<Array>} Notification list
   */
  getNotifications: (limit = 20, offset = 0) =>
    handleRequest(
      api.get(`/notifications?limit=${limit}&offset=${offset}`)
    ),
  
  /**
   * Retrieve unread notification count
   * @returns {Promise<number>} Count value
   */
  getUnreadCount: () =>
    handleRequest(api.get('/notifications/unread/count')),
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification identifier
   * @returns {Promise<Object>} Updated notification
   */
  updateReadStatus: (notificationId) =>
    handleRequest(api.put(`/notifications/${notificationId}/read`)),
  
  /**
   * Mark all notifications as read
   * @returns {Promise<number>} Number of notifications updated
   */
  updateAllReadStatus: () =>
    handleRequest(api.put('/notifications/read/all')),
  
  /**
   * Delete a notification
   * @param {string} notificationId - Notification identifier
   * @returns {Promise<string>} Deleted notification id
   */
  deleteNotification: (notificationId) =>
    handleRequest(api.delete(`/notifications/${notificationId}`))
};

export default NotificationsAPI;