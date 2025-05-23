import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SessionsAPI from '../../api/sessions';
import Button from '../common/Button';
import Modal from '../common/Modal';

const SessionCard = ({ session, userType, onStatusUpdate }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
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
  
  // Calculate session duration in minutes
  const calculateDuration = () => {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return Math.round((end - start) / (1000 * 60));
  };
  
  // Check if session is upcoming
  const isUpcoming = () => {
    return new Date(session.startTime) > new Date();
  };
  
  // Handle session cancellation
  const handleCancel = async () => {
    setLoading(true);
    setError('');
    
    try {
      await SessionsAPI.updateSessionStatus(session._id, 'cancelled');
      setShowCancelModal(false);
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel session. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle submit feedback
  const handleSubmitFeedback = async () => {
    setLoading(true);
    setError('');
    
    try {
      await SessionsAPI.addFeedback(session._id, rating, comment);
      setShowFeedbackModal(false);
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
      released: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(session.paymentStatus)}`}>
                {session.paymentStatus}
              </span>
            </div>
            
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Session with {userType === 'user'
                ? `${session.professional?.user?.firstName} ${session.professional?.user?.lastName}`
                : `${session.user?.firstName} ${session.user?.lastName}`}
            </h3>
            
            <p className="mt-1 text-sm text-gray-500">
              {formatDateTime(session.startTime)}
            </p>
            
            <p className="text-sm text-gray-500">
              Duration: {calculateDuration()} minutes
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">
              ${session.price?.toFixed(2)}
            </p>
          </div>
        </div>
        
        {session.notes && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {session.notes}
            </p>
          </div>
        )}
        
        {session.feedback && (
          <div className="mt-3 bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <p className="text-sm font-medium text-gray-700">Feedback:</p>
              <div className="ml-2 flex">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i}
                    className={`h-4 w-4 ${i < session.feedback.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
            </div>
            {session.feedback.comment && (
              <p className="mt-1 text-sm text-gray-600">
                {session.feedback.comment}
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
        <div>
          {session.zoomMeetingUrl && (
            
              href={session.zoomMeetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Join Zoom Meeting
            </a>
          )}
        </div>
        
        <div className="flex space-x-2">
          {/* Show different buttons based on session status and user type */}
          {userType === 'user' && session.status === 'completed' && !session.feedback && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowFeedbackModal(true)}
            >
              Leave Feedback
            </Button>
          )}
          
          {isUpcoming() && session.status === 'scheduled' && (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => setShowCancelModal(true)}
            >
              Cancel
            </Button>
          )}
          
          <Link to={`/sessions/${session._id}`}>
            <Button variant="light" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Session"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setShowCancelModal(false)}
              disabled={loading}
            >
              Keep Session
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancel}
              isLoading={loading}
              disabled={loading}
            >
              Cancel Session
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to cancel this session? This action cannot be undone.
        </p>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </Modal>
      
      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Leave Feedback"
        footer={
          <>
            <Button 
              variant="light" 
              onClick={() => setShowFeedbackModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmitFeedback}
              isLoading={loading}
              disabled={loading}
            >
              Submit Feedback
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate your session:
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <svg 
                    className={`h-8 w-8 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Comments (optional):
            </label>
            <textarea
              id="comment"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              placeholder="Share your thoughts about the session..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

SessionCard.propTypes = {
  session: PropTypes.object.isRequired,
  userType: PropTypes.oneOf(['user', 'professional']).isRequired,
  onStatusUpdate: PropTypes.func
};

export default SessionCard;