import React from 'react';
import ProfessionalList from '../components/professionals/professionalList';

const ProfessionalsPage = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Professionals</h1>
        <p className="text-lg text-gray-600 mb-8">
          Connect with industry professionals for virtual networking, advice, and potential referrals.
        </p>
        
        <ProfessionalList />
      </div>
    </div>
  );
};

export default ProfessionalsPage;