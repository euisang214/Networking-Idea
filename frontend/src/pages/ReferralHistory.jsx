import React from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import { ReferralHistory } from '../components/referrals';

const ReferralHistoryPage = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-7xl mx-auto py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Referrals</h1>
        <ReferralHistory />
      </div>
    </div>
  );
};

export default ReferralHistoryPage;
