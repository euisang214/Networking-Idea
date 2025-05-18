import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClockIcon, 
  CalendarIcon, 
  VideoCameraIcon,
  ChatAlt2Icon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/outline';
import { format } from 'date-fns';
import { Card, Button, Modal, ConfirmationModal } from '../common';
import useAuth from '../../hooks/useAuth';

const SessionDetail = ({ 
  session, 
  onCancel, 
  onComplete, 
  onJoin, 
  isLoading = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
  
  if (!session) return null;
  
  // Helper to determine if user is the seeker in this session
  const isSeeker = user?.id === session.seeker_id;
  
  // Helper to determine if user is the professional in this session
  const isProfessional = user?.id === session.professional_id;
  
  // Format session date
  const formattedDate = session.scheduled_at 
    ? format(new Date(session.scheduled_at), 'EEEE, MMMM d, yyyy')
    : '';
  
  // Format session time
  const formattedTime = session.scheduled_at
    ? format(new Date(session.scheduled_at), 'h:mm a')
    : '';
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-5 w-5" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5" />;
      case 'no_show':
        return <ExclamationCircleIcon className="h-5 w-5" />;
      default:
        return null;
    }
  };
  
  // Helper function to check if session is upcoming
  const isUpcoming = () => {
    if (session.status !== 'scheduled') return false;
    const sessionDate = new Date(session.scheduled_at);
    return sessionDate > new Date();
  };
  
  // Helper function to check if session is about to start (within 15 minutes)
  const isAboutToStart = () => {
    if (session.status !== 'scheduled') return false;
    const sessionDate = new Date(session.scheduled_at);
    const now = new Date();
    const diffInMinutes = (sessionDate - now) / (1000 * 60);
    return diffInMinutes <= 15 && diffInMinutes >= -60; // Can join 15 min before, up to 60 min after
  };
  
  // Helper function to check if session is past
  const isPast = () => {
    if (session.status !== 'scheduled') return false;
    const sessionDate = new Date(session.scheduled_at);
    sessionDate.setMinutes(sessionDate.getMinutes() + session.duration_minutes);
    return sessionDate < new Date();
  };
  
  // Helper to render action buttons based on session status and user role
  const renderActionButtons = () => {
    if (session.status === 'cancelled' || session.status === 'no_show') {
      return (
        <Button
          variant="outline"
          onClick={() => navigate('/professionals')}
        >
          Find Another Professional
        </Button>
      );
    }
    
    if (session.status === 'completed') {
      if (isSeeker && !session.feedback) {
        return (
          <Button
            variant="primary"
            onClick={() => navigate(`/sessions/${session.id}/feedback`)}
          >
            Leave Feedback
          </Button>
        );
      }
      return (
        <Button
          variant="outline"
          onClick={() => navigate('/sessions')}
        >
          View All Sessions
        </Button>
      );
    }
    
    // For scheduled sessions
    return (
      <div className="flex space-x-3">
        {isAboutToStart() && (
          <Button
            variant="primary"
            onClick={onJoin}
            className="flex items-center"
          >
            <VideoCameraIcon className="h-5 w-5 mr-1" />
            Join Session
          </Button>
        )}
        
        {isUpcoming() && (
          <Button
            variant="outline"
            onClick={() => setShowCancelModal(true)}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Cancel Session
          </Button>
        )}
        
        {isPast() && isProfessional && (
          <Button
            variant="primary"
            onClick={() => setShowCompleteModal(true)}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    );
  };
  
  // Render stars for rating
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${
              index < (rating || 0) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Session Details
            </h2>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  session.status
                )}`}
              >
                {getStatusIcon(session.status)}
                <span className="ml-1 capitalize">{session.status}</span>
              </span>
            </div>
          </div>
          
          {/* Show payment status for seeker */}
          {isSeeker && session.payment && (
            <div className="flex items-center text-sm text-gray-500">
              <CreditCardIcon className="h-5 w-5 mr-1" />
              <span className="capitalize">{session.payment.status}</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-base font-medium text-gray-900">
              Professional
            </h3>
            <div className="mt-2 flex items-center">
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={session.professional_profile_picture || '/images/default-avatar.png'}
                alt="Professional"
              />
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">
                  {session.professional_first_name} {session.professional_last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {session.professional_job_title}
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-base font-medium text-gray-900">
              Session Information
            </h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                {formattedDate}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                {formattedTime} ({session.duration_minutes} minutes)
              </div>
              {session.zoom_meeting_url && (
                <div className="flex items-center text-sm text-gray-500">
                  <VideoCameraIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Zoom Meeting
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-base font-medium text-gray-900">
            Discussion Topic
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {session.topic || 'No topic specified'}
          </p>
        </div>
        
        {/* Show feedback if available and completed */}
        {session.status === 'completed' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">
                Feedback
              </h3>
              {session.rating > 0 && renderStars(session.rating)}
            </div>
            {session.feedback ? (
              <p className="mt-2 text-sm text-gray-500">
                {session.feedback}
              </p>
            ) : isSeeker ? (
              <p className="mt-2 text-sm text-gray-500 italic">
                You haven't left feedback yet.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500 italic">
                No feedback has been provided yet.
              </p>
            )}
          </div>
        )}
        
        {/* Additional details dropdown */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowDetailsDropdown(!showDetailsDropdown)}
          >
            <h3 className="text-base font-medium text-gray-900">
              Additional Details
            </h3>
            {showDetailsDropdown ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {showDetailsDropdown && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Session ID</p>
                  <p className="font-medium text-gray-900">{session.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created On</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(session.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {session.payment && (
                  <>
                    <div>
                      <p className="text-gray-500">Payment ID</p>
                      <p className="font-medium text-gray-900">
                        {session.payment.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment Amount</p>
                      <p className="font-medium text-gray-900">
                        ${session.payment.amount}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              {session.zoom_meeting_url && (
                <div>
                  <p className="text-gray-500">Meeting Link</p>
                  <a
                    href={session.zoom_meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    {session.zoom_meeting_url}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
          {renderActionButtons()}
        </div>
      </Card>
      
      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Session"
        onConfirm={() => {
          setShowCancelModal(false);
          onCancel && onCancel(session.id);
        }}
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        isLoading={isLoading}
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to cancel this session? This action cannot be undone.
          {isSeeker && (
            <span>
              {' '}
              You may be eligible for a full refund if cancelling more than 24 hours
              before the scheduled time.
            </span>
          )}
        </p>
      </ConfirmationModal>
      
      {/* Complete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Mark Session as Completed"
        onConfirm={() => {
          setShowCompleteModal(false);
          onComplete && onComplete(session.id);
        }}
        confirmText="Mark as Completed"
        cancelText="Cancel"
        confirmVariant="primary"
        isLoading={isLoading}
      >
        <p className="text-sm text-gray-500">
          Are you sure you want to mark this session as completed? This will allow
          the seeker to leave feedback and finalize the payment.
        </p>
      </ConfirmationModal>
    </>
  );
};

export default SessionDetail;
