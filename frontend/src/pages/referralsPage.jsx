import React from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import { ReferralList } from '../components/referrals';

const ReferralsPage = () => {
  const { user } = useAuth();
  
  // Redirect if not a professional
  if (!user || user.userType !== 'professional') {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Referrals</h1>
        <p className="text-lg text-gray-600 mb-8">
          Track and manage your referrals. Earn additional rewards when you refer candidates to colleagues at your company.
        </p>
        
        <ReferralList />
      </div>
    </div>
  );
};

export default ReferralsPage;