import React, { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../hooks';
import { Navigate, Link } from 'react-router-dom';
import Card from '../components/common/card';
import Button from '../components/common/button';
import Spinner from '../components/common/spinner';

const NotificationsPage = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const [actionLoading, setActionLoading] = useState({});

  if (!user) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [notificationId]: true }));
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`delete_${notificationId}`]: true }));
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${notificationId}`]: false }));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(prev => ({ ...prev, markAll: true }));
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, markAll: false }));
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      sessionCreated: '📅',
      sessionReminder: '⏰',
      paymentSuccess: '💳',
      paymentReleased: '💰',
      newMessage: '💬',
      referralVerified: '✅',
      referralRewarded: '🎉',
      jobOfferReported: '💼',
      offerBonusPaid: '💰',
      feedbackSubmitted: '⭐'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      sessionCreated: 'bg-blue-50 border-blue-200',
      sessionReminder: 'bg-yellow-50 border-yellow-200',
      paymentSuccess: 'bg-green-50 border-green-200',
      paymentReleased: 'bg-green-50 border-green-200',
      newMessage: 'bg-purple-50 border-purple-200',
      referralVerified: 'bg-green-50 border-green-200',
      referralRewarded: 'bg-green-50 border-green-200',
      jobOfferReported: 'bg-blue-50 border-blue-200',
      offerBonusPaid: 'bg-green-50 border-green-200',
      feedbackSubmitted: 'bg-blue-50 border-blue-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationTitle = (notification) => {
    const titles = {
      sessionCreated: 'New Session Booked',
      sessionReminder: 'Session Reminder',
      paymentSuccess: 'Payment Successful',
      paymentReleased: 'Payment Released',
      newMessage: 'New Message',
      referralVerified: 'Referral Verified',
      referralRewarded: 'Referral Rewarded',
      jobOfferReported: 'Job Offer Reported',
      offerBonusPaid: 'Offer Bonus Paid',
      feedbackSubmitted: 'Feedback Submitted'
    };
    return notification.title || titles[notification.type] || 'Notification';
  };

  const getNotificationMessage = (notification) => {
    if (notification.message) return notification.message;
    
    const { data, type } = notification;
    switch (type) {
      case 'sessionCreated':
        return `Your session with ${data?.professionalName || 'a professional'} has been confirmed.`;
      case 'sessionReminder':
        return `Your session is starting soon!`;
      case 'paymentSuccess':
        return `Payment of $${data?.amount || '0'} was successful.`;
      case 'newMessage':
        return `You have a new message from ${data?.senderName || 'someone'}.`;
      case 'referralVerified':
        return `Your referral has been verified and rewarded.`;
      case 'jobOfferReported':
        return `A job offer bonus of $${data?.offerBonusAmount || '0'} is available.`;
      default:
        return 'You have a new notification.';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your latest activities</p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              isLoading={actionLoading.markAll}
              disabled={actionLoading.markAll}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-500">
                When you have new activity, you'll see it here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-6 transition-colors ${
                  !notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {getNotificationTitle(notification)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification._id)}
                            isLoading={actionLoading[notification._id]}
                            disabled={actionLoading[notification._id]}
                          >
                            Mark as Read
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification._id)}
                          isLoading={actionLoading[`delete_${notification._id}`]}
                          disabled={actionLoading[`delete_${notification._id}`]}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {/* Action buttons for specific notification types */}
                    {notification.type === 'sessionReminder' && notification.data?.sessionId && (
                      <div className="mt-3">
                        <Button
                          variant="primary"
                          size="sm"
                          to={`/sessions/${notification.data.sessionId}`}
                        >
                          View Session
                        </Button>
                      </div>
                    )}
                    
                    {notification.type === 'newMessage' && (
                      <div className="mt-3">
                        <Button
                          variant="primary"
                          size="sm"
                          to="/messages"
                        >
                          View Messages
                        </Button>
                      </div>
                    )}
                    
                    {notification.type === 'jobOfferReported' && (
                      <div className="mt-3">
                        <Button
                          variant="primary"
                          size="sm"
                          to="/job-offers"
                        >
                          View Job Offers
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;