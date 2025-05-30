import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import JobOffersAPI from '../../api/jobOffers';
import { Button, Card, Input } from '../common';

const JobOfferForm = ({ session, onOfferReported }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    startDate: '',
    salary: ''
  });

  const isCandidate = user.id === session.user._id;
  const isProfessional = user.id === session.professional.user._id;

  // Only show if session is completed and feedback has been exchanged
  const canReportOffer = session.status === 'completed' && 
    session.feedback?.professionalProvidedAt &&
    (isCandidate || isProfessional);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await JobOffersAPI.reportOffer(session._id, {
        position: formData.position,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null
      });
      
      onOfferReported?.();
      
      // Reset form
      setFormData({ position: '', startDate: '', salary: '' });
    } catch (error) {
      console.error('Failed to report job offer:', error);
      alert('Failed to report job offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canReportOffer) {
    return null;
  }

  return (
    <Card className="mt-6">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report Job Offer</h3>
        <p className="text-sm text-gray-600 mb-4">
          {isCandidate 
            ? `Did you receive and accept a job offer from ${session.professional.companyName || 'this company'}?`
            : `Did ${session.user.firstName} receive and accept a job offer from your company?`
          }
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Offer Bonus: ${session.user.offerBonusAmount?.toFixed(2) || '0.00'}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  {isCandidate 
                    ? 'You committed to paying this amount to the first professional at this company who helped you network.'
                    : 'This is the offer bonus you could earn if this hire is confirmed.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="position"
            label="Position Title"
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
            required
            placeholder="Software Engineer, Product Manager, etc."
          />

          <Input
            id="startDate"
            label="Start Date (optional)"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          />

          <Input
            id="salary"
            label="Annual Salary (optional)"
            type="number"
            value={formData.salary}
            onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
            placeholder="75000"
          />

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Confirmation Required
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    The other party will need to confirm this job offer before any offer bonus is processed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            isLoading={loading}
            fullWidth
          >
            Report Job Offer
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default JobOfferForm;