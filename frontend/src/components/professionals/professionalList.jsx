import React from 'react';
import { ProfessionalCard } from './';
import { Button, Spinner } from '../common';

/**
 * Professional list component for displaying a list of professionals
 * @param {Object} props - Component props
 * @param {Array} props.professionals - List of professionals
 * @param {boolean} [props.loading=false] - Whether the list is loading
 * @param {boolean} [props.error=null] - Error message if loading failed
 * @param {Object} [props.pagination] - Pagination information
 * @param {Function} [props.onPageChange] - Function to call when page changes
 * @param {boolean} [props.compact=false] - Whether to display compact cards
 * @returns {React.ReactElement} - Professional list component
 */
const ProfessionalList = ({
  professionals = [],
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
  compact = false,
}) => {
  // If loading, show spinner
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" text="Loading professionals..." />
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // If no professionals found, show message
  if (professionals.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No professionals found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Try adjusting your search filters or check back later.
        </p>
      </div>
    );
  }

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null;

    const { page, pages, total } = pagination;

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(page * pagination.limit, total)}
            </span>{' '}
            of <span className="font-medium">{total}</span> professionals
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="space-y-4">
        {professionals.map((professional) => (
          <ProfessionalCard
            key={professional.id}
            professional={professional}
            compact={compact}
          />
        ))}
      </div>
      
      {renderPagination()}
    </div>
  );
};

export default ProfessionalList;
