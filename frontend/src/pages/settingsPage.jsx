import React, { useState } from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import AuthAPI from '../api/auth';
import UserAPI from '../api/user';
import Card from '../components/common/card';
import Button from '../components/common/button';
import Input from '../components/common/input';
import { useForm } from '../hooks/useForm';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState({ password: false, notifications: false });
  const [message, setMessage] = useState({ password: '', notifications: '' });

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Password change form
  const validatePasswordForm = (values) => {
    const errors = {};
    if (!values.currentPassword) errors.currentPassword = 'Current password is required';
    if (!values.newPassword) errors.newPassword = 'New password is required';
    if (values.newPassword && values.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (values.newPassword !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handlePasswordSubmit = async () => {
    try {
      setLoading(prev => ({ ...prev, password: true }));
      await AuthAPI.updatePassword(passwordValues.currentPassword, passwordValues.newPassword);
      setMessage(prev => ({ ...prev, password: 'Password updated successfully!' }));
      resetPasswordForm();
      setTimeout(() => setMessage(prev => ({ ...prev, password: '' })), 3000);
    } catch (error) {
      console.error('Failed to update password:', error);
      setMessage(prev => ({ ...prev, password: 'Failed to update password. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const {
    values: passwordValues,
    errors: passwordErrors,
    touched: passwordTouched,
    handleChange: handlePasswordChange,
    handleBlur: handlePasswordBlur,
    handleSubmit: submitPasswordForm,
    resetForm: resetPasswordForm
  } = useForm(
    {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    handlePasswordSubmit,
    validatePasswordForm
  );

  // Notification settings
  const [notifications, setNotifications] = useState(user.settings?.notifications || {
    email: {
      sessionReminders: true,
      paymentReceipts: true,
      newMessages: true,
      referralUpdates: true
    },
    push: {
      sessionReminders: true,
      paymentReceipts: true,
      newMessages: true,
      referralUpdates: true
    }
  });

  const handleNotificationChange = (type, setting, value) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: value
      }
    }));
  };

  const handleNotificationSubmit = async () => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      const updatedUser = await UserAPI.updateProfile({ settings: { notifications } });
      updateUser(updatedUser);
      setMessage(prev => ({ ...prev, notifications: 'Notification settings updated!' }));
      setTimeout(() => setMessage(prev => ({ ...prev, notifications: '' })), 3000);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      setMessage(prev => ({ ...prev, notifications: 'Failed to update settings. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences</p>
      </div>

      <div className="space-y-8">
        {/* Change Password */}
        <Card title="Change Password">
          {message.password && (
            <div className={`mb-4 p-3 rounded-md ${
              message.password.includes('success') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message.password}
            </div>
          )}
          
          <form onSubmit={submitPasswordForm} className="space-y-4">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordValues.currentPassword}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={passwordTouched.currentPassword && passwordErrors.currentPassword}
              required
            />
            
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordValues.newPassword}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={passwordTouched.newPassword && passwordErrors.newPassword}
              helpText="Must be at least 8 characters"
              required
            />
            
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordValues.confirmPassword}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              error={passwordTouched.confirmPassword && passwordErrors.confirmPassword}
              required
            />
            
            <Button
              type="submit"
              variant="primary"
              isLoading={loading.password}
              disabled={loading.password}
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* Notification Settings */}
        <Card title="Notification Preferences">
          {message.notifications && (
            <div className={`mb-4 p-3 rounded-md ${
              message.notifications.includes('updated') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message.notifications}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.sessionReminders}
                    onChange={(e) => handleNotificationChange('email', 'sessionReminders', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Session reminders</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.paymentReceipts}
                    onChange={(e) => handleNotificationChange('email', 'paymentReceipts', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Payment receipts</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.newMessages}
                    onChange={(e) => handleNotificationChange('email', 'newMessages', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>New messages</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.referralUpdates}
                    onChange={(e) => handleNotificationChange('email', 'referralUpdates', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Referral updates</span>
                </label>
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.push.sessionReminders}
                    onChange={(e) => handleNotificationChange('push', 'sessionReminders', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Session reminders</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.push.paymentReceipts}
                    onChange={(e) => handleNotificationChange('push', 'paymentReceipts', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Payment receipts</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.push.newMessages}
                    onChange={(e) => handleNotificationChange('push', 'newMessages', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>New messages</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.push.referralUpdates}
                    onChange={(e) => handleNotificationChange('push', 'referralUpdates', e.target.checked)}
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Referral updates</span>
                </label>
              </div>
            </div>
            
            <Button
              variant="primary"
              onClick={handleNotificationSubmit}
              isLoading={loading.notifications}
              disabled={loading.notifications}
            >
              Save Notification Settings
            </Button>
          </div>
        </Card>

        {/* Account Actions */}
        <Card title="Account Actions" className="border-red-200">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Danger Zone</h3>
              <p className="text-gray-600 mb-4">
                These actions cannot be undone. Please be careful.
              </p>
              <Button variant="danger" disabled>
                Delete Account
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Contact support to delete your account.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;