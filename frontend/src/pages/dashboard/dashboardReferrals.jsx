import React, { useState, useEffect } from 'react';
import ReferralsAPI from '../../api/referrals';
import Card from '../../components/common/card';
import Button from '../../components/common/button';
import Spinner from '../../components/common/spinner';

const DashboardReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReferral, setNewReferral] = useState({
    candidateEmail: '',
    referralType: 'email'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const referralsData = await ReferralsAPI.getProfessionalReferrals();
      setReferrals(referralsData);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await ReferralsAPI.createReferral(
        newReferral.candidateEmail,
        newReferral.referralType
      );
      setNewReferral({ candidateEmail: '', referralType: 'email' });
      setShowCreateForm(false);
      await fetchReferrals();
    } catch (error) {
      console.error('Failed to create referral:', error);
      alert('Failed to create referral. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      rewarded: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRewardAmount = (referral) => {
    return referral.rewardAmount || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading referrals..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-600">Track your referrals and earn rewards for successful matches</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Referral'}
        </Button>
      </div>

      {/* Create Referral Form */}
      {showCreateForm && (
        <Card title="Create New Referral">
          <form onSubmit={handleCreateReferral} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Candidate Email
              </label>
              <input
                type="email"
                value={newReferral.candidateEmail}
                onChange={(e) => setNewReferral({
                  ...newReferral,
                  candidateEmail: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="candidate@example.com"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the email address of the candidate you want to refer
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Type
              </label>
              <select
                value={newReferral.referralType}
                onChange={(e) => setNewReferral({
                  ...newReferral,
                  referralType: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="email">Email Referral</option>
                <option value="link">Referral Link</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={creating}
                disabled={creating}
              >
                Create Referral
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Referral Instructions */}
      <Card title="How Referrals Work">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">1. Send Email Referral</h4>
              <p className="text-blue-700">
                Email a colleague at your company referring the candidate, and CC referrals@mentorconnect.com
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">2. Domain Verification</h4>
              <p className="text-blue-700">
                We verify that both your email and recipient's email are from the same company domain
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">3. Earn Rewards</h4>
              <p className="text-blue-700">
                Receive compensation when your referral leads to successful candidate placement
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Referrals List */}
      <Card title={`Your Referrals (${referrals.length})`}>
        <div className="divide-y divide-gray-200">
          {referrals.length > 0 ? (
            referrals.map((referral) => (
              <div key={referral._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* Referral Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {referral.candidate?.email || referral.candidateEmail || 'Unknown Candidate'}
                        </h3>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Type:</span> {referral.referralType}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Created:</span> {formatDate(referral.createdAt)}
                          </p>
                          {referral.emailDetails && (
                            <div className="text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Email Referral:</span>{' '}
                                {referral.emailDetails.senderEmail} → {referral.emailDetails.recipientEmail}
                              </p>
                              {referral.emailDetails.subject && (
                                <p>
                                  <span className="font-medium">Subject:</span> {referral.emailDetails.subject}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status and Reward */}
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(referral.status)}`}>
                            {referral.status}
                          </span>
                          {referral.emailDomainVerified && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Domain Verified
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          ${getRewardAmount(referral).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {referral.status === 'rewarded' ? 'Paid' : 'Potential Reward'}
                        </p>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {referral.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {referral.notes}
                        </p>
                      </div>
                    )}

                    {/* Status-specific information */}
                    {referral.status === 'pending' && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Pending:</span> Your referral is being reviewed. 
                          {!referral.emailDomainVerified && ' Please ensure you CC referrals@mentorconnect.com on your referral email.'}
                        </p>
                      </div>
                    )}

                    {referral.status === 'verified' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Verified:</span> Your referral has been verified and you're eligible for rewards.
                        </p>
                      </div>
                    )}

                    {referral.status === 'rewarded' && referral.payoutDate && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Rewarded:</span> Payment of ${getRewardAmount(referral).toFixed(2)} was processed on {formatDate(referral.payoutDate)}.
                        </p>
                      </div>
                    )}

                    {referral.status === 'rejected' && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Rejected:</span> This referral did not meet verification requirements.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start earning rewards by referring qualified candidates to your colleagues.
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Your First Referral
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardReferrals;