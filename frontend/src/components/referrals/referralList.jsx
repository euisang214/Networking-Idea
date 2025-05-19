import React, { useState, useEffect } from 'react';
import ReferralsAPI from '../../api/referrals';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import ReferralInstructions from './ReferralInstructions';

const ReferralList = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'verified', 'rewarded'
  
  useEffect(() => {
    fetchReferrals();
  }, []);
  
  const fetchReferrals = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await ReferralsAPI.getProfessionalReferrals();
      setReferrals(response);
    } catch (err) {
      setError('Failed to load referrals. Please try again later.');
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter referrals by status
  const filteredReferrals = activeTab === 'all' 
    ? referrals 
    : referrals.filter(referral => referral.status === activeTab);
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      rewarded: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="space-y-6">
      <ReferralInstructions />
      
      <Card>
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-6">
            <button
              className={`pb-3 px-1 ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Referrals
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === 'verified'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('verified')}
            >
              Verified
            </button>
            <button
              className={`pb-3 px-1 ${
                activeTab === 'rewarded'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('rewarded')}
            >
              Rewarded
            </button>
          </nav>
        </div>
        
        {/* Referral list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" text="Loading referrals..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' 
                ? "You haven't made any referrals yet." 
                : `You don't have any ${activeTab} referrals.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referred To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReferrals.map((referral) => (
                  <tr key={referral._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {referral.candidate.firstName} {referral.candidate.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {referral.candidate.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {referral.emailDetails ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {referral.emailDetails.recipientEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            Domain: {referral.emailDetails.recipientDomain}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {referral.referralType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                        {referral.status}
                      </span>
                      {referral.emailDomainVerified && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Domain verified
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {referral.status === 'rewarded' ? (
                        <div className="text-sm font-medium text-green-600">
                          ${referral.rewardAmount?.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Pending
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReferralList;