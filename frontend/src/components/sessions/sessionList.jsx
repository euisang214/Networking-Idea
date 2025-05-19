import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SessionsAPI from '../../api/sessions';
import SessionCard from './SessionCard';
import Spinner from '../common/Spinner';
import Button from '../common/Button';

const SessionList = ({ type = 'user' }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'all'
  
  useEffect(() => {
    fetchSessions();
  }, [type, activeTab]);
  
  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Determine status filter based on active tab
      let statusFilter = null;
      if (activeTab === 'upcoming') {
        statusFilter = 'scheduled';
      } else if (activeTab === 'past') {
        statusFilter = 'completed';
      }
      
      // Fetch sessions based on user type
      const response = type === 'user' 
        ? await SessionsAPI.getUserSessions(statusFilter)
        : await SessionsAPI.getProfessionalSessions(statusFilter);
      
      setSessions(response.data);
    } catch (err) {
      setError('Failed to load sessions. Please try again later.');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter sessions based on date
  const filterSessionsByDate = (sessions) => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return sessions.filter(session => new Date(session.startTime) > now);
    } else if (activeTab === 'past') {
      return sessions.filter(session => new Date(session.startTime) <= now);
    }
    
    return sessions;
  };
  
  const filteredSessions = filterSessionsByDate(sessions);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'upcoming'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'past'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" text="Loading sessions..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : filteredSessions.length === 0 ? (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'upcoming' 
                ? "You don't have any upcoming sessions scheduled." 
                : activeTab === 'past' 
                ? "You don't have any past sessions." 
                : "You don't have any sessions."}
            </p>
            <div className="mt-6">
              <Link to="/professionals">
                <Button variant="primary">
                  {type === 'user' ? 'Find a Professional' : 'View Your Profile'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <SessionCard 
                key={session._id} 
                session={session} 
                userType={type}
                onStatusUpdate={fetchSessions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

SessionList.propTypes = {
  type: PropTypes.oneOf(['user', 'professional'])
};

export default SessionList;