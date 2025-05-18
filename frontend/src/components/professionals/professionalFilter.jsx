import React, { useState } from 'react';
import { 
  SearchIcon, 
  FilterIcon, 
  XIcon 
} from '@heroicons/react/outline';
import { Input, Button, Card } from '../common';

/**
 * Professional filter component for filtering professionals
 * @param {Object} props - Component props
 * @param {Function} props.onFilter - Function to call when filters change
 * @param {Array} props.industries - List of industries for filtering
 * @param {Object} props.initialFilters - Initial filter values
 * @returns {React.ReactElement} - Professional filter component
 */
const ProfessionalFilter = ({ onFilter, industries = [], initialFilters = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    industry: initialFilters.industry || '',
    minExperience: initialFilters.minExperience || '',
    maxRate: initialFilters.maxRate || '',
    expertise: initialFilters.expertise || '',
    onlyAvailable: initialFilters.onlyAvailable || false,
    ...initialFilters
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle filter submit
  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  // Handle filter reset
  const handleReset = () => {
    const resetFilters = {
      search: '',
      industry: '',
      minExperience: '',
      maxRate: '',
      expertise: '',
      onlyAvailable: false
    };
    setFilters(resetFilters);
    onFilter(resetFilters);
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        {/* Top row with search and toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                placeholder="Search by name, job title, company..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={filters.search}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center"
          >
            <FilterIcon className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
        
        {/* Expanded filters */}
        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Industry filter */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.industry}
                  onChange={handleChange}
                >
                  <option value="">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Experience filter */}
              <div>
                <label htmlFor="minExperience" className="block text-sm font-medium text-gray-700">
                  Min. Experience (years)
                </label>
                <input
                  type="number"
                  id="minExperience"
                  name="minExperience"
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.minExperience}
                  onChange={handleChange}
                />
              </div>
              
              {/* Rate filter */}
              <div>
                <label htmlFor="maxRate" className="block text-sm font-medium text-gray-700">
                  Max. Hourly Rate ($)
                </label>
                <input
                  type="number"
                  id="maxRate"
                  name="maxRate"
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.maxRate}
                  onChange={handleChange}
                />
              </div>
              
              {/* Expertise filter */}
              <div>
                <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
                  Expertise
                </label>
                <input
                  type="text"
                  id="expertise"
                  name="expertise"
                  placeholder="e.g. React, Marketing"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={filters.expertise}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Additional filters row */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="onlyAvailable"
                  name="onlyAvailable"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={filters.onlyAvailable}
                  onChange={handleChange}
                />
                <label htmlFor="onlyAvailable" className="ml-2 block text-sm text-gray-700">
                  Show only available professionals
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  onClick={handleReset}
                  className="text-gray-600"
                >
                  <XIcon className="h-4 w-4 mr-1 inline" />
                  Clear Filters
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};

export default ProfessionalFilter;
