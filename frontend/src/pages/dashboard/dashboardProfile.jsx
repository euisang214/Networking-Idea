import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import ProfessionalsAPI from '../../api/professionals';
import Card from '../../components/common/card';
import Button from '../../components/common/button';
import Spinner from '../../components/common/spinner';

const DashboardProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    skills: [],
    hourlyRate: '',
    companyName: '',
    industry: '',
    yearsOfExperience: '',
    education: [],
    certifications: [],
    languages: [],
    availability: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    from: '',
    to: '',
    current: false
  });
  const [showEducationForm, setShowEducationForm] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, industriesData] = await Promise.all([
        ProfessionalsAPI.getOwnProfile(),
        ProfessionalsAPI.getIndustries()
      ]);
      
      setProfile(profileData);
      setIndustries(industriesData);
      
      // Pre-fill form with existing data
      setFormData({
        title: profileData.title || '',
        bio: profileData.bio || '',
        skills: profileData.skills || [],
        hourlyRate: profileData.hourlyRate || '',
        companyName: profileData.companyName || '',
        industry: profileData.industry?._id || '',
        yearsOfExperience: profileData.yearsOfExperience || '',
        education: profileData.education || [],
        certifications: profileData.certifications || [],
        languages: profileData.languages || [],
        availability: profileData.availability || []
      });
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAddEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, { ...newEducation }]
      }));
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        from: '',
        to: '',
        current: false
      });
      setShowEducationForm(false);
    }
  };

  const handleRemoveEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await ProfessionalsAPI.updateProfile(profile._id, formData);
      
      // Update user context if basic info changed
      if (formData.title !== profile.title) {
        updateUser({ title: formData.title });
      }
      
      await fetchProfileData(); // Refresh data
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Professional Profile</h1>
          <p className="text-gray-600">Manage your professional information and availability</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            profile?.isVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {profile?.isVerified ? 'Verified' : 'Pending Verification'}
          </span>
          <Button
            variant="primary"
            onClick={handleSaveProfile}
            isLoading={saving}
            disabled={saving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              value={formData.yearsOfExperience}
              onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="5"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Google, Microsoft"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an industry</option>
              {industries.map(industry => (
                <option key={industry._id} value={industry._id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate (USD)
            </label>
            <input
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="100"
              min="1"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Professional Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell potential candidates about your background, expertise, and what you can help them with..."
          />
        </div>
      </Card>

      {/* Skills */}
      <Card title="Skills & Expertise">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a skill (e.g., JavaScript, Product Management)"
            />
            <Button variant="outline" onClick={handleAddSkill}>
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Education */}
      <Card title="Education">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Educational Background</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEducationForm(!showEducationForm)}
            >
              {showEducationForm ? 'Cancel' : 'Add Education'}
            </Button>
          </div>

          {showEducationForm && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="University of California, Berkeley"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bachelor of Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={newEducation.fieldOfStudy}
                    onChange={(e) => setNewEducation({...newEducation, fieldOfStudy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newEducation.from}
                      onChange={(e) => setNewEducation({...newEducation, from: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2015"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      value={newEducation.to}
                      onChange={(e) => setNewEducation({...newEducation, to: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2019"
                      disabled={newEducation.current}
                    />
                  </div>
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={newEducation.current}
                      onChange={(e) => setNewEducation({...newEducation, current: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Currently enrolled</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Button variant="primary" size="sm" onClick={handleAddEducation}>
                  Add Education
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEducationForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {formData.education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {edu.from} - {edu.current ? 'Present' : edu.to}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveEducation(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Statistics */}
      {profile?.statistics && (
        <Card title="Performance Statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {profile.statistics.completedSessions || 0}
              </p>
              <p className="text-sm text-gray-600">Completed Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {profile.statistics.averageRating ? profile.statistics.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {profile.statistics.successfulReferrals || 0}
              </p>
              <p className="text-sm text-gray-600">Successful Referrals</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardProfile;