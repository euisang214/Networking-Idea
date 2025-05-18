import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  CalendarIcon, 
  VideoCameraIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline';
import { format } from 'date-fns';
import { Card, Button } from '../common';

const SessionCard = ({ session, showActions = true }) => {
  if (!session) return null;
  
  // Format session date
  const formattedDate = session.scheduled_at 
    ? format(new Date(session.scheduled_at), 'EEE, MMM d, yyyy')
    : '';
  
  // Format session time
  const formattedTime = session.scheduled_at
    ? format(new Date(session.scheduled_at), 'h:mm a')
    : '';
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      case 'no_show':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Helper function to check if session is about to start (within 15 minutes)
  const isAboutToStart = () => {
    if (session.status !== 'scheduled') return false;
    const sessionDate = new Date(session.scheduled_at);
    const now = new Date();
    const diffInMinutes = (sessionDate - now) / (1000 * 60);
    return diffInMinutes <= 15 && diffInMinutes >= -60; // Can join 15 min before, up to 60 min after
  };
  
  return (
    <Card hover clickable>
      <div className="flex flex-col sm:flex-row sm:items-center">
        {/* Status badge */}
        <div className="mb-4 sm:mb-0 sm:mr-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              session.status
            )}`}
          >
            {getStatusIcon(session.status)}
            <span className="ml-1 capitalize">{session.status}</span>
          </span>
        </div>
        
        {/* Date and time */}
        <div className="flex items-center mb-4 sm:mb-0 sm:mr-6">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-1" />
          <span className="text-sm text-gray-500">{formattedDate}</span>
          <ClockIcon className="h-5 w-5 text-gray-400 ml-4 mr-1" />
          <span className="text-sm text-gray-500">{formattedTime}</span>
        </div>
        
        {/* Duration */}
        <div className="flex items-center mb-4 sm:mb-0 sm:mr-6">
          <span className="text-sm text-gray-500">{session.duration_minutes} minutes</span>
        </div>
        
        {/* Person info */}
        <div className="flex items-center mb-4 sm:mb-0">
          <UserIcon className="h-5 w-5 text-gray-400 mr-1" />
          <span className="text-sm font-medium text-gray-900">
            {session.other_person_first_name} {session.other_person_last_name}
          </span>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="sm:ml-auto mt-4 sm:mt-0 flex items-center space-x-3">
            {isAboutToStart() && (
              <Button
                to={`/sessions/${session.id}/join`}
                variant="primary"
                size="sm"
                className="flex items-center"
              >
                <VideoCameraIcon className="h-4 w-4 mr-1" />
                Join
              </Button>
            )}
            <Button
              to={`/sessions/${session.id}`}
              variant="outline"
              size="sm"
            >
              Details
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SessionCard;
