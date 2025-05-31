import React, { useState } from 'react';
import { useAuth } from '../hooks';
import SessionList from '../components/sessions/sessionList';
import Card from '../components/common/card';

const SessionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'professional'
  
  return (
    <div className="container mx-auto px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Sessions</h1>
        
        {/* Show tabs only if user is both a candidate and professional */}
        {user && user.userType === 'professional' && (
          <div className="mb-6">
            <nav className="flex space-x-4 border-b border-gray-200">
              <button
                className={`pb-4 px-1 ${
                  activeTab === 'user'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('user')}
              >
                As Candidate
              </button>
              <button
                className={`pb-4 px-1 ${
                  activeTab === 'professional'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('professional')}
              >
                As Professional
              </button>
            </nav>
          </div>
        )}
        
        <SessionList type={activeTab} />
        
        {/* Session information */}
        <Card title="About Sessions" className="mt-8">
          <div className="space-y-4">
            <p className="text-gray-600">
              Sessions are 30-minute virtual meetings conducted via Zoom where you can connect with industry professionals for networking, advice, and potential referrals.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What to Expect</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>One-on-one virtual conversation</li>
                  <li>Career advice and industry insights</li>
                  <li>Answers to your specific questions</li>
                  <li>Potential for referrals to open positions</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Session Policies</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Free cancellation up to 24 hours in advance</li>
                  <li>Payments are only released after sessions are verified</li>
                  <li>Be prompt and professional</li>
                  <li>Respect privacy and confidentiality</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SessionsPage;