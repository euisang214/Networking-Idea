import React, { useState, useEffect } from 'react';
import ProfessionalsAPI from '../../api/professionals';
import ProfessionalCard from './ProfessionalCard';
import ProfessionalFilter from './ProfessionalFilter';
import Spinner from '../common/Spinner';
import Button from '../common/Button';

const ProfessionalList = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Fetch professionals on initial load and when filters/pagination change
  useEffect(() => {
    fetchProfessionals();
  }, [filters, pagination.page]);
  
  const fetchProfessionals = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await ProfessionalsAPI.getProfessionals(
        filters, 
        pagination.page, 
        pagination.limit
      );
      
      setProfessionals(response.data.professionals);
      setPagination({
        ...pagination,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      });
    } catch (err) {
      setError('Failed to load professionals. Please try again later.');
      console.error('Error fetching professionals:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    // Reset to page 1 when filters change
    setFilters(newFilters);
    setPagination({
      ...pagination,
      page: 1
    });
  };
  
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
    // Scroll to top of the list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filters */}
        <div className="lg:col-span-1">
          <ProfessionalFilter onFilterChange={handleFilterChange} />
        </div>
        
        {/* Professional list */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold mb-6">Available Professionals</h2>
          
          {loading && professionals.length === 0 ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" text="Loading professionals..." />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : professionals.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">
                No professionals found matching your criteria. Try adjusting your filters.
              </span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                {professionals.map((professional) => (
                  <ProfessionalCard key={professional._id} professional={professional} />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="inline-flex rounded-md shadow">
                    <Button
                      variant="light"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="rounded-l-md rounded-r-none"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center px-4 bg-white border-t border-b border-gray-300">
                      <span className="text-sm text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                    </div>
                    
                    <Button
                      variant="light"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="rounded-r-md rounded-l-none"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalList;