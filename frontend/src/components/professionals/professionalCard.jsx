import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ClockIcon,
  StarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/outline';
import { Card, Button } from '../common';

/**
 * Professional card component for displaying a professional's information
 * @param {Object} props - Component props
 * @param {Object} props.professional - Professional data
 * @param {boolean} [props.compact=false] - Whether to display a compact version
 * @param {boolean} [props.showActions=true] - Whether to show action buttons
 * @returns {React.ReactElement} - Professional card component
 */
const ProfessionalCard = ({ professional, compact = false, showActions = true }) => {
  // Stars for rating
  const renderStars = (rating = 0) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            className={`h-4 w-4 ${
              index < rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">
          ({professional.reviewsCount || 0})
        </span>
      </div>
    );
  };
  
  // Format experience years
  const formatExperience = (years) => {
    if (!years && years !== 0) return 'Experience not specified';
    if (years === 0) return 'Less than 1 year';
    if (years === 1) return '1 year';
    return `${years} years`;
  };
  
  // Format hourly rate
  const formatRate = (rate) => {
    if (!rate) return 'Rate not specified';
    return `$${rate}/hour`;
  };
  
  if (compact) {
    // Compact version (for list views)
    return (
      <Card
        hover
        clickable
        onClick={() => {}}
        className="transition-all duration-200 hover:translate-y-[-4px]"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img
              className="h-16 w-16 rounded-full object-cover"
              src={professional.profile_picture || '/images/default-avatar.png'}
              alt={`${professional.first_name} ${professional.last_name}`}
            />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {professional.first_name} {professional.last_name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {professional.job_title} {professional.company_name && `at ${professional.company_name}`}
            </p>
            <div className="mt-1 flex items-center">
              <div className="mr-4 flex items-center text-sm text-gray-500">
                <BriefcaseIcon className="mr-1 h-4 w-4" />
                {formatExperience(professional.years_experience)}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <CurrencyDollarIcon className="mr-1 h-4 w-4" />
                {formatRate(professional.hourly_rate)}
              </div>
            </div>
          </div>
          {showActions && (
            <div className="ml-4">
              <Button
                to={`/professionals/${professional.id}`}
                variant="outline"
                size="sm"
              >
                View Profile
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }
  
  // Full version (for detailed views)
  return (
    <Card
      hover
      className="transition-all duration-200 hover:translate-y-[-4px]"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="flex flex-col items-center sm:items-start mb-4 sm:mb-0 sm:mr-6">
          <img
            className="h-24 w-24 rounded-full object-cover"
            src={professional.profile_picture || '/images/default-avatar.png'}
            alt={`${professional.first_name} ${professional.last_name}`}
          />
          {professional.is_available && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              Available
            </span>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-medium text-gray-900">
            {professional.first_name} {professional.last_name}
          </h3>
          
          <p className="mt-1 text-sm text-gray-600">
            {professional.job_title} {professional.company_name && `at ${professional.company_name}`}
          </p>
          
          <div className="mt-2">{renderStars(professional.rating)}</div>
          
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center text-sm text-gray-500">
              <BriefcaseIcon className="mr-1.5 h-4 w-4 text-gray-400" />
              {formatExperience(professional.years_experience)}
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <AcademicCapIcon className="mr-1.5 h-4 w-4 text-gray-400" />
              {professional.industry_name || 'Industry not specified'}
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="mr-1.5 h-4 w-4 text-gray-400" />
              {professional.sessionCount || 0} sessions completed
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <CurrencyDollarIcon className="mr-1.5 h-4 w-4 text-gray-400" />
              {formatRate(professional.hourly_rate)}
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500 line-clamp-2">
              {professional.bio || 'No bio available'}
            </p>
          </div>
          
          {professional.expertise_areas && professional.expertise_areas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {professional.expertise_areas.map((area, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
          
          {showActions && (
            <div className="mt-6 flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              <Button
                to={`/professionals/${professional.id}`}
                variant="primary"
                size="sm"
              >
                View Full Profile
              </Button>
              
              <Button
                to={`/sessions/book/${professional.id}`}
                variant="secondary"
                size="sm"
              >
                Book a Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProfessionalCard;
