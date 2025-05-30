import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import SessionsAPI from '../../api/sessions';
import { Button, Card } from '../common';

const FeedbackForm = ({ session, onFeedbackSubmitted }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [candidateFeedback, setCandidateFeedback] = useState({
    rating: 5,
    comment: ''
  });
  const [professionalFeedback, setProfessionalFeedback] = useState('');

  const isCandidate = user.id === session.user._id;
  const isProfessional = user.id === session.professional.user._id;
  
  const canSubmitCandidateFeedback = isCandidate && 
    session.status === 'completed' && 
    !session.feedback?.candidateProvidedAt;
  
  const canSubmitProfessionalFeedback = isProfessional && 
    session.status === 'completed' && 
    !session.feedback?.professionalProvidedAt;

  const handleCandidateFeedbackSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await SessionsAPI.createCandidateFeedback(
        session._id,
        candidateFeedback.rating,
        candidateFeedback.comment
      );
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit candidate feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionalFeedbackSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await SessionsAPI.createProfessionalFeedback(session._id, professionalFeedback);
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit professional feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canSubmitCandidateFeedback && !canSubmitProfessionalFeedback) {
    return null;
  }

  return (
    <Card className="mt-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Feedback</h3>
        
        {canSubmitCandidateFeedback && (
          <form onSubmit={handleCandidateFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate your session (1-5 stars)
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCandidateFeedback(prev => ({ ...prev, rating: star }))}
                    className={`w-8 h-8 ${
                      star <= candidateFeedback.rating 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional comments (optional)
              </label>
              <textarea
                value={candidateFeedback.comment}
                onChange={(e) => setCandidateFeedback(prev => ({ ...prev, comment: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your thoughts about the session..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              isLoading={loading}
            >
              Submit Feedback
            </Button>
          </form>
        )}

        {canSubmitProfessionalFeedback && (
          <form onSubmit={handleProfessionalFeedbackSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your feedback for {session.user.firstName} {session.user.lastName}
              </label>
              <textarea
                value={professionalFeedback}
                onChange={(e) => setProfessionalFeedback(e.target.value)}
                rows={5}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide detailed feedback about the candidate's background, interests, and potential fit for roles at your company..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Your feedback helps the candidate improve and may unlock their referral bonus potential.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !professionalFeedback.trim()}
              isLoading={loading}
            >
              Submit Feedback
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
};

export default FeedbackForm;