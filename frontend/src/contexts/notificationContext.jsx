import React, { createContext, useState, useEffect, useCallback } from 'react';
import NotificationsAPI from '../api/notifications';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, initialized } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Fetch notifications
  const fetchNotifications = useCallback(async (limit = 20, offset = 0) => {
    if (!user) return [];
    
    try {
      setLoading(true);
      const notificationsData = await NotificationsAPI.getNotifications(limit, offset);
      setNotifications(notificationsData);
      return notificationsData;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return 0;
    }
    
    try {
      const count = await NotificationsAPI.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }, [user]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await NotificationsAPI.updateReadStatus(notificationId);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true, readAt: new Date() } 
          : notification
      ));
      
      // Update unread count
      fetchUnreadCount();
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await NotificationsAPI.updateAllReadStatus();
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true,
        readAt: new Date()
      })));
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };
  
  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await NotificationsAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(notifications.filter(notification => 
        notification._id !== notificationId
      ));
      
      // Update unread count if needed
      const wasUnread = notifications.find(n => n._id === notificationId && !n.read);
      if (wasUnread) {
        fetchUnreadCount();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };
  
  // Initialize notifications and start polling
  useEffect(() => {
    if (initialized && user) {
      // Initial fetch
      fetchNotifications();
      fetchUnreadCount();
      
      // Set up polling for unread count
      const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [initialized, user, fetchNotifications, fetchUnreadCount]);
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};