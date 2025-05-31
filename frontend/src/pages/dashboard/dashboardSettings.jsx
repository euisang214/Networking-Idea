import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import ProfessionalsAPI from '../../api/professionals';
import Card from '../../components/common/card';
import Button from '../../components/common/button';
import Spinner from '../../components/common/spinner';

const DashboardSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState({
    sessionSettings: {
      defaultSessionLength: 30,
      minSessionLength: 15,
      maxSessionLength: 60,
      bufferBetweenSessions: 15,
      maxSessionsPerDay: 5
    },
    availability: [],
    payoutSettings: {
      payoutSchedule: 'weekly',
      autoPayoutThreshold: 100,
      defaultMethod: 'bank_account'
    },
    isActive: true
  });
  const [newAvailability, setNewAvailability] = useState({
    day: 'monday',
    startTime: '09:00',
    endTime: '17:00'
  });

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const profileData = await ProfessionalsAPI.getOwnProfile();
      setProfile(profileData);
      
      setSettings({
        sessionSettings: profileData.sessionSettings || {
          defaultSessionLength: 30,
          minSessionLength: 15,
          maxSessionLength: 60,
          bufferBetweenSessions: 15,
          maxSessionsPerDay: 5
        },
        availability: profileData.availability || [],
        payoutSettings: profileData.payoutSettings || {
          payoutSchedule: 'weekly',
          autoPayoutThreshold: 100,
          defaultMethod: 'bank_account'
        },
        isActive: profileData.isActive !== false
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      sessionSettings: {
        ...prev.sessionSettings,
        [field]: parseInt(value) || value
      }
    }));
  };

  const handlePayoutSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      payoutSettings: {
        ...prev.payoutSettings,
        [field]: field === 'autoPayoutThreshold' ? parseInt(value) : value
      }
    }));
  };

  const handleAddAvailability = () => {
    const existingDay = settings.availability.find(a => a.day === newAvailability.day);
    if (existingDay) {
      alert('You already have availability set for this day. Please remove it first.');
      return;
    }

    setSettings(prev => ({
      ...prev,
      availability: [...prev.availability, { ...newAvailability }]
    }));
    
    setNewAvailability({
      day: 'monday',
      startTime: '09:00',
      endTime: '17:00'
    });
  };

  const handleRemoveAvailability = (dayToRemove) => {
    setSettings(prev => ({
      ...prev,
      availability: prev.availability.filter(a => a.day !== dayToRemove)
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await ProfessionalsAPI.updateProfile(profile._id, settings);
      await fetchSettings(); // Refresh data
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayLabel = (day) => {
    return daysOfWeek.find(d => d.value === day)?.label || day;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your availability, session preferences, and payout settings</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSaveSettings}
          isLoading={saving}
          disabled={saving}
        >
          Save Changes
        </Button>
      </div>

      {/* Account Status */}
      <Card title="Account Status">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Professional Account</h3>
            <p className="text-sm text-gray-600">
              {settings.isActive ? 'Your account is active and visible to candidates' : 'Your account is currently inactive'}
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.isActive}
              onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Account Active
            </label>
          </div>
        </div>
      </Card>

      {/* Availability Settings */}
      <Card title="Availability">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Availability</h4>
            {settings.availability.length > 0 ? (
              <div className="space-y-2">
                {settings.availability.map((avail, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{getDayLabel(avail.day)}</span>
                      <span className="text-gray-600 ml-2">
                        {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAvailability(avail.day)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4">No availability set. Add your available days and times below.</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Add Availability</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day
                </label>
                <select
                  value={newAvailability.day}
                  onChange={(e) => setNewAvailability({...newAvailability, day: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newAvailability.startTime}
                  onChange={(e) => setNewAvailability({...newAvailability, startTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={newAvailability.endTime}
                  onChange={(e) => setNewAvailability({...newAvailability, endTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Button variant="outline" onClick={handleAddAvailability}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Session Settings */}
      <Card title="Session Preferences">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Session Length (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionSettings.defaultSessionLength}
              onChange={(e) => handleSessionSettingChange('defaultSessionLength', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="15"
              max="120"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buffer Between Sessions (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionSettings.bufferBetweenSessions}
              onChange={(e) => handleSessionSettingChange('bufferBetweenSessions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="60"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Sessions Per Day
            </label>
            <input
              type="number"
              value={settings.sessionSettings.maxSessionsPerDay}
              onChange={(e) => handleSessionSettingChange('maxSessionsPerDay', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Session Length (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionSettings.minSessionLength}
              onChange={(e) => handleSessionSettingChange('minSessionLength', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="15"
              max="60"
            />
          </div>
        </div>
      </Card>

      {/* Payout Settings */}
      <Card title="Payout Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payout Schedule
            </label>
            <select
              value={settings.payoutSettings.payoutSchedule}
              onChange={(e) => handlePayoutSettingChange('payoutSchedule', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              How often you want to receive payouts
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Payout Amount ($)
            </label>
            <input
              type="number"
              value={settings.payoutSettings.autoPayoutThreshold}
              onChange={(e) => handlePayoutSettingChange('autoPayoutThreshold', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum amount before automatic payout
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Payment Method
            </label>
            <select
              value={settings.payoutSettings.defaultMethod}
              onChange={(e) => handlePayoutSettingChange('defaultMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bank_account">Bank Account</option>
              <option value="card">Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Payment Account</h4>
              <p className="text-sm text-blue-700">
                {profile?.stripeConnectedAccountId 
                  ? 'Your payment account is connected and ready to receive payouts.'
                  : 'You need to connect a payment account to receive earnings.'}
              </p>
              {!profile?.stripeConnectedAccountId && (
                <div className="mt-2">
                  <Button variant="primary" size="sm">
                    Connect Payment Account
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card title="Notification Preferences">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive emails for important updates</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Session Reminders</h4>
              <p className="text-sm text-gray-600">Get reminded about upcoming sessions</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">New Session Requests</h4>
              <p className="text-sm text-gray-600">Be notified when candidates request sessions</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Payout Notifications</h4>
              <p className="text-sm text-gray-600">Get notified when payouts are processed</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardSettings;