import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SessionsAPI from '../../api/sessions';
import Card from '../common/Card';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

const SessionDetail = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);
  
  const fetchSessionDetails = async () => {
    try {
      const sessionData = await SessionsAPI.getSession(sessionId);
      setSession(sessionData);
    } catch (err) {
      setError('Failed to load session details. Please try again later.');
      console.error('Error fetching session details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date and time
  const formatDateTime = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };
  
  // Format date only
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };
  
  // Calculate session duration in minutes
  const calculateDuration = () => {
    if (!session) return 0;
    
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return Math.round((end - start) / (1000 * 60));
  };
  
  // Check if session is upcoming
  const isUpcoming = () => {
    if (!session) return false;
    return new Date(session.startTime) > new Date();
  };
  
  // Get user type - professional or candidate
  const getUserType = () => {
    if (!session || !user) return null;
    
    if (session.professional && session.professional.user === user.id) {
      return 'professional';
    } else if (session.user && session.user._id === user.id) {
      return 'candidate';
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading session details..." />
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error || 'Session not found'}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
          <p className="text-gray-600">
            {getUserType() === 'professional' 
              ? `With ${session.user.firstName} ${session.user.lastName}`
              : `With ${session.professional.anonymizedProfile.displayName}`}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link to="/sessions">
            <Button variant="light">
              Back to Sessions
            </Button>
          </Link>
          
          {isUpcoming() && (
            <>
              {session.zoomMeetingUrl && (
                
                  href={session.zoomMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary">
                    Join Zoom Meeting
                  </Button>
                </a>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main session info */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Session Information</h2>
              </div>
              
              <div className="flex space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  session.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                  session.status === 'completed' ? 'bg-green-100 text-green-800' :
                  session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {session.status}
                </span>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  session.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  session.paymentStatus === 'refunded' ? 'bg-red-100 text-red-800' :
                  session.paymentStatus === 'released' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Payment: {session.paymentStatus}
                </span>
              </div>
            </div>
            
            <div className="mt-4 border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(session.startTime)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(session.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                    {new Date(session.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {calculateDuration()} minutes
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${session.price?.toFixed(2)}
                  </dd>
                </div>
                
                {session.zoomMeetingVerified && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Verification</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Session verified through Zoom ({session.verificationDetails?.meetingDuration} minutes, {session.verificationDetails?.participantCount} participants)
                    </dd>
                  </div>
                )}
                
                {session.notes && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {session.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            
            {session.feedback && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-2">Feedback</h3>
                <div className="bg-gray-50 rounded p-4">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          className={`h-5 w-5 ${i < session.feedback.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {session.feedback.rating}/5
                      </span>
                    </div>
                    
                    <span className="ml-4 text-xs text-gray-500">
                      Provided on {formatDate(session.feedback.providedAt)}
                    </span>
                  </div>
                  
                  {session.feedback.comment && (
                    <p className="mt-2 text-gray-700">
                      {session.feedback.comment}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
          
          {/* Messages section placeholder */}
          <Card title="Messages" className="mt-6">
            <div className="flex justify-center py-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Use the messaging feature to communicate about this session.
                </p>
                <Link to={`/messages/${getUserType() === 'professional' ? session.user._id : session.professional.user}`}>
                  <Button variant="primary">
                    View Messages
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* User/Professional info */}
          <Card title={getUserType() === 'professional' ? 'Candidate Information' : 'Professional Information'}>
            {getUserType() === 'professional' ? (
              <div>
                <p className="font-medium mb-1">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {session.user.email}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium mb-1">
                  {session.professional.anonymizedProfile.displayName}
                </p>
                <p className="text-gray-600 text-sm mb-1">
                  {session.professional.anonymizedProfile.anonymizedTitle}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                  {session.professional.anonymizedProfile.anonymizedCompany}
                </p>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Meeting Information</h3>
              {session.zoomMeetingUrl ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Join the Zoom meeting at the scheduled time to connect.
                  </p>
                  
                    href={session.zoomMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Join Zoom Meeting
                  </a>
                  
                  {session.zoomMeetingPassword && (
                    <p className="mt-2 text-sm text-gray-600">
                      Password: <span className="font-medium">{session.zoomMeetingPassword}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Zoom meeting details will be available once the session is confirmed.
                </p>
              )}
            </div>
          </Card>
          
          {/* Session policies */}
          <Card title="Session Policies" className="mt-6">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-900">Cancellation Policy</h3>
                <p className="text-gray-600 mt-1">
                  Free cancellation up to 24 hours before the scheduled session time. Cancellations made less than 24 hours in advance may be subject to a fee.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Payment Policy</h3>
                <p className="text-gray-600 mt-1">
                  Payment is processed upon booking but only released to the professional after the session is verified as completed through Zoom.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;