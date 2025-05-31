import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import ProfessionalsAPI from '../../api/professionals';
import SessionsAPI from '../../api/sessions';
import Button from '../common/button';
import Card from '../common/card';
import Spinner from '../common/spinner';
import BookingForm from '../sessions/bookingForm';

const ProfessionalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professional, setProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Fetch professional details
  useEffect(() => {
    fetchProfessionalDetails();
  }, [id]);
  
  const fetchProfessionalDetails = async () => {
    try {
      const professionalData = await ProfessionalsAPI.getProfile(id);
      setProfessional(professionalData);
    } catch (err) {
      setError('Failed to load professional details. Please try again later.');
      console.error('Error fetching professional details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format hourly rate as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Handle book session click
  const handleBookSession = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/professionals/${id}` } });
      return;
    }
    
    setShowBookingForm(true);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading professional details..." />
      </div>
    );
  }
  
  if (error || !professional) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error || 'Professional not found'}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Professional info and booking */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {professional.user.firstName} {professional.user.lastName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {professional.title} at {professional.company?.name || professional.companyName}
                </p>
                
                <div className="flex items-center mt-2">
                  <span className="flex items-center text-yellow-500">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {professional.statistics.averageRating 
                      ? `${professional.statistics.averageRating.toFixed(1)} (${professional.statistics.completedSessions} sessions)` 
                      : 'New Professional'}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-gray-600">{professional.yearsOfExperience} years experience</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 md:text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(professional.hourlyRate)}/hr
                </p>
                
                {!showBookingForm && (
                  <Button 
                    variant="primary"
                    className="mt-2" 
                    onClick={handleBookSession}
                  >
                    Book a Session
                  </Button>
                )}
              </div>
            </div>
            
            {/* Bio */}
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">About</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {professional.bio}
              </p>
            </div>
            
            {/* Skills */}
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {professional.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </Card>
          
          {/* Booking form */}
          {showBookingForm && (
            <div className="mt-6">
              <Card title="Book a Session">
                <BookingForm 
                  professional={professional}
                  onCancel={() => setShowBookingForm(false)}
                />
              </Card>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Availability */}
          <Card title="Availability">
            <div className="space-y-3">
              {professional.availability && professional.availability.length > 0 ? (
                professional.availability.map((slot, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="capitalize">{slot.day}</span>
                    <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No availability information.</p>
              )}
            </div>
          </Card>
          
          {/* Session information */}
          <Card title="Session Information" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Session Length</h3>
                <p className="text-gray-600">
                  {professional.sessionSettings?.defaultSessionLength || 30} minutes (default)
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">What to Expect</h3>
                <ul className="text-gray-600 list-disc pl-5 mt-1 space-y-1">
                  <li>Virtual 1:1 session via Zoom</li>
                  <li>Career advice and industry insights</li>
                  <li>Casual, confidential conversation</li>
                  <li>Potential for referrals to their network</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700">Cancellation Policy</h3>
                <p className="text-gray-600">
                  Free cancellation up to 24 hours before the session.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetail;