import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import UserAPI from '../api/user';
import ProfessionalsAPI from '../api/professionals';
import Card from '../components/common/card';
import Button from '../components/common/button';
import Input from '../components/common/input';
import { useForm } from '../hooks/useForm';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [message, setMessage] = useState('');

  const validateForm = (values) => {
    const errors = {};
    if (!values.firstName) errors.firstName = 'First name is required';
    if (!values.lastName) errors.lastName = 'Last name is required';
    if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    return errors;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const updatedUser = await UserAPI.updateProfile(values);
      updateUser(updatedUser);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm } = useForm(
    {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      offerBonusAmount: user?.offerBonusAmount || 0
    },
    handleSubmit,
    validateForm
  );

  useEffect(() => {
    if (!user || user.userType !== 'professional') return;

    const fetchProfessionalProfile = async () => {
      try {
        const profile = await ProfessionalsAPI.getOwnProfile();
        setProfessionalProfile(profile);
      } catch (error) {
        console.log('No professional profile found');
      }
    };

    fetchProfessionalProfile();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card title="Basic Information">
          <form onSubmit={submitForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.firstName && errors.firstName}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.lastName && errors.lastName}
                required
              />
            </div>
            
            <Input
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              disabled
              helpText="Contact support to change your email address"
            />
            
            <Input
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={values.phoneNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phoneNumber && errors.phoneNumber}
            />

            {user.userType === 'candidate' && (
              <Input
                label="Offer Bonus Amount ($)"
                name="offerBonusAmount"
                type="number"
                min="0"
                step="0.01"
                value={values.offerBonusAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.offerBonusAmount && errors.offerBonusAmount}
                helpText="Amount you'll pay professionals who successfully refer you to a job"
              />
            )}
            
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
            >
              Update Profile
            </Button>
          </form>
        </Card>

        {/* Professional Profile */}
        {user.userType === 'professional' && (
          <Card title="Professional Information">
            {professionalProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900">{professionalProfile.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <p className="text-gray-900">{professionalProfile.companyName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
                  </label>
                  <p className="text-gray-900">${professionalProfile.hourlyRate}/hour</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <p className="text-gray-900">{professionalProfile.yearsOfExperience} years</p>
                </div>
                <Button variant="outline" to="/dashboard/profile">
                  Edit Professional Profile
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No professional profile found</p>
                <Button variant="primary" to="/dashboard/profile">
                  Create Professional Profile
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Account Stats */}
        <Card title="Account Statistics">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Type</span>
              <span className="font-medium capitalize">{user.userType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email Verified</span>
              <span className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                {user.emailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;