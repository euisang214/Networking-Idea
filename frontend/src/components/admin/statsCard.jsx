import React from 'react';
import PropTypes from 'prop-types';

const StatsCard = ({ title, value, change, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600',
    green: 'bg-green-500 text-green-600',
    yellow: 'bg-yellow-500 text-yellow-600',
    red: 'bg-red-500 text-red-600',
    purple: 'bg-purple-500 text-purple-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-opacity-10 ${colorClasses[color]}`}>
          <div className={`w-6 h-6 ${colorClasses[color].split(' ')[1]}`}>
            {icon}
          </div>
        </div>
        
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <span className={`ml-2 text-sm font-medium ${
                change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'yellow', 'red', 'purple'])
};

export default StatsCard;