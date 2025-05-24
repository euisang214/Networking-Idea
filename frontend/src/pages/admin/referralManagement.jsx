
import React, { useState, useEffect } from 'react';
import AdminAPI from '../../api/admin';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

const ReferralManagement = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filters, setFilters] = useState({ status: 'all' });

  useEffect(() => {
    fetchReferrals();
  }, [filters]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const referralsData = await AdminAPI.getReferrals(
        filters.status === 'all' ? null : filters.status
      );
      setReferrals(referralsData);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReferral = async (referralId) => {
    try {
      setActionLoading(prev => ({ ...prev, [referralId]: true }));
      await AdminAPI.verifyReferral(referralId);
      
      setReferrals(referrals.map(referral => 
        referral._id === referralId 
          ? { ...referral, status: 'verified', rewardAmount: 50.00 }
          : referral
      ));
    } catch (error) {
      console.error('Failed to verify referral:', error);
      alert('Failed to verify referral. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [referralId]: false }));
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading referrals..." />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
        <p className="text-gray-600">Review and verify referrals for rewards</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All Referrals</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rewarded">Rewarded</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Referrals Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.map((referral) => (
                <tr key={referral._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {referral.professional?.user?.firstName} {referral.professional?.user?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {referral.professional?.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {referral.candidate?.email || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        → {referral.emailDetails?.recipientEmail || 'N/A'}
                      </div>
                      {referral.emailDomainVerified && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Domain verified
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(referral.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(referral.status)}`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${referral.rewardAmount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {referral.status === 'pending' && referral.emailDomainVerified && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerifyReferral(referral._id)}
                        isLoading={actionLoading[referral._id]}
                        disabled={actionLoading[referral._id]}
                      >
                        Verify & Pay
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReferralManagement;