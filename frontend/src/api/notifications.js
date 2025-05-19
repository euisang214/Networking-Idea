import api from './index';

const NotificationsAPI = {
  // Get all notifications
  getNotifications: async (limit = 20, offset = 0) => {
    const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
    return response.data.data.notifications;
  },
  
  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data.data.count;
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data.notification;
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read/all');
    return response.data.data.count;
  },
  
  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data.data.notificationId;
  }
};

export default NotificationsAPI;