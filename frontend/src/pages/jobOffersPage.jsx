import React from 'react';
import { useAuth } from '../hooks';
import { Navigate } from 'react-router-dom';
import JobOffersList from '../components/jobOffers/jobOffersList';

const JobOffersPage = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-7xl mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Job Offers</h1>
          <p className="text-lg text-gray-600 mt-2">
            Track job offers and offer bonuses from your networking sessions.
          </p>
        </div>
        
        <JobOffersList />
      </div>
    </div>
  );
};

export default JobOffersPage;