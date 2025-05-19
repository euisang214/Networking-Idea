import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProfessionalsAPI from '../../api/professionals';
import Input from '../common/Input';
import Button from '../common/Button';

const ProfessionalFilter = ({ onFilterChange }) => {
  const [industries, setIndustries] = useState([]);
  const [filters, setFilters] = useState({
    industry: '',
    skills: '',
    minExperience: '',
    maxRate: ''
  });
  const [loading, setLoading] = useState(false);
  
  // Fetch industries on component mount
  useEffect(() => {
    fetchIndustries();
  }, []);
  
  const fetchIndustries = async () => {
    try {
      const industriesData = await ProfessionalsAPI.getIndustries();
      setIndustries(industriesData);
    } catch (error) {
      console.error('Failed to fetch industries:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Convert skills to array if not empty
    const formattedFilters = {
      ...filters,
      skills: filters.skills ? filters.skills.split(',').map(skill => skill.trim()) : []
    };
    
    onFilterChange(formattedFilters);
    setTimeout(() => setLoading(false), 300); // Small delay to show loading state
  };
  
  const handleReset = () => {
    setFilters({
      industry: '',
      skills: '',
      minExperience: '',
      maxRate: ''
    });
    
    onFilterChange({});
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Professionals</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Industry filter */}
        <div className="mb-4">
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            id="industry"
            name="industry"
            value={filters.industry}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Industries</option>
            {industries.map((industry) => (
              <option key={industry._id} value={industry._id}>
                {industry.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Skills filter */}
        <Input
          label="Skills (comma separated)"
          name="skills"
          type="text"
          value={filters.skills}
          onChange={handleInputChange}
          placeholder="e.g. React, JavaScript, Node.js"
        />
        
        {/* Experience filter */}
        <div className="mb-4">
          <label htmlFor="minExperience" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Years of Experience
          </label>
          <select
            id="minExperience"
            name="minExperience"
            value={filters.minExperience}
            onChange={handleInputChange}
            className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Any Experience</option>
            <option value="1">1+ years</option>
            <option value="3">3+ years</option>
            <option value="5">5+ years</option>
            <option value="10">10+ years</option>
            <option value="15">15+ years</option>
          </select>
        </div>
        
        {/* Hourly rate filter */}
        <Input
          label="Maximum Hourly Rate ($)"
          name="maxRate"
          type="number"
          value={filters.maxRate}
          onChange={handleInputChange}
          placeholder="e.g. 150"
          min="1"
        />
        
        <div className="mt-6 space-y-3">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={loading}
          >
            Apply Filters
          </Button>
          
          <Button 
            type="button" 
            variant="light" 
            fullWidth 
            onClick={handleReset}
          >
            Reset Filters
          </Button>
        </div>
      </form>
    </div>
  );
};

ProfessionalFilter.propTypes = {
  onFilterChange: PropTypes.func.isRequired
};

export default ProfessionalFilter;