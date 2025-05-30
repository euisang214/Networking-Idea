import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import JobOffersAPI from '../../api/jobOffers';
import { Button, Card, Spinner } from '../common';

const JobOffersList = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const data = await JobOffersAPI.getMyOffers();
      setOffers(data);
    } catch (error) {
      console.error('Failed to fetch job offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOffer = async (offerId) => {
    setActionLoading(prev => ({ ...prev, [offerId]: true }));

    try {
      await JobOffersAPI.confirmOffer(offerId);
      await fetchOffers(); // Refresh the list
    } catch (error) {
      console.error('Failed to confirm job offer:', error);
      alert('Failed to confirm job offer. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [offerId]: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" text="Loading job offers..." />
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No job offers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Job offers will appear here when you or your networking partners report them.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <Card key={offer._id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {offer.offerDetails?.position || 'Position Not Specified'}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(offer.status)}`}>
                  {offer.status}
                </span>
              </div>
              
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Candidate:</span>{' '}
                  {offer.candidate.firstName} {offer.candidate.lastName}
                </p>
                <p>
                  <span className="font-medium">Professional:</span>{' '}
                  {offer.professional.user?.firstName} {offer.professional.user?.lastName}
                </p>
                <p>
                  <span className="font-medium">Company:</span>{' '}
                  {offer.professional.companyName || 'Not specified'}
                </p>
                <p>
                  <span className="font-medium">Reported:</span>{' '}
                  {formatDate(offer.reportedAt)} by {offer.reportedBy}
                </p>
                {offer.confirmedAt && (
                  <p>
                    <span className="font-medium">Confirmed:</span>{' '}
                    {formatDate(offer.confirmedAt)} by {offer.confirmedBy}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center space-x-4">
                <div className="text-lg font-semibold text-green-600">
                  Bonus: ${offer.bonusAmount.toFixed(2)}
                </div>
                {offer.offerDetails?.salary && (
                  <div className="text-sm text-gray-600">
                    Salary: ${offer.offerDetails.salary.toLocaleString()}
                  </div>
                )}
                {offer.offerDetails?.startDate && (
                  <div className="text-sm text-gray-600">
                    Start: {formatDate(offer.offerDetails.startDate)}
                  </div>
                )}
              </div>
            </div>

            <div className="ml-4">
              {offer.status === 'reported' && offer.reportedBy !== user.userType && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleConfirmOffer(offer._id)}
                  isLoading={actionLoading[offer._id]}
                  disabled={actionLoading[offer._id]}
                >
                  Confirm Offer
                </Button>
              )}
              
              {offer.status === 'paid' && (
                <div className="text-center">
                  <div className="text-sm text-green-600 font-medium">✓ Paid</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(offer.paidAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {offer.status === 'reported' && offer.reportedBy === user.userType && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Waiting for confirmation from the other party.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default JobOffersList;