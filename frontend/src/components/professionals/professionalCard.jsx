import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from '../../common/Button';

const ProfessionalCard = ({ professional }) => {
  // Format hourly rate as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {professional.user.firstName} {professional.user.lastName}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {professional.title} at {professional.company?.name || professional.companyName}
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-medium text-gray-900">
              {formatCurrency(professional.hourlyRate)}/hr
            </p>
            <div className="flex items-center mt-1">
              <p className="flex items-center text-sm text-yellow-500">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                {professional.statistics.averageRating ? professional.statistics.averageRating.toFixed(1) : 'New'}
              </p>
              <span className="mx-2 text-gray-300">•</span>
              <p className="text-sm text-gray-500">
                {professional.statistics.completedSessions} sessions
              </p>
            </div>
          </div>
        </div>
        
        <div className="my-3">
          <p className="text-sm text-gray-600 line-clamp-3">
            {professional.bio}
          </p>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2">
          {professional.skills.slice(0, 4).map((skill, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {skill}
            </span>
          ))}
          {professional.skills.length > 4 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{professional.skills.length - 4} more
            </span>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {professional.yearsOfExperience} years exp.
        </p>
        <Link to={`/professionals/${professional._id}`}>
          <Button variant="primary" size="sm">
            View Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};

ProfessionalCard.propTypes = {
  professional: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    user: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired
    }).isRequired,
    title: PropTypes.string.isRequired,
    company: PropTypes.shape({
      name: PropTypes.string
    }),
    companyName: PropTypes.string,
    bio: PropTypes.string,
    hourlyRate: PropTypes.number.isRequired,
    yearsOfExperience: PropTypes.number.isRequired,
    skills: PropTypes.arrayOf(PropTypes.string),
    statistics: PropTypes.shape({
      averageRating: PropTypes.number,
      completedSessions: PropTypes.number
    }).isRequired
  }).isRequired
};

export default ProfessionalCard;