import React from 'react';

/**
 * Spinner component for indicating loading state
 * @param {Object} props - Component props
 * @param {string} [props.size='md'] - Spinner size (xs, sm, md, lg, xl)
 * @param {string} [props.color='primary'] - Spinner color (primary, secondary, white)
 * @param {boolean} [props.fullScreen=false] - Whether to display the spinner full screen
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.text] - Loading text to display below the spinner
 * @returns {React.ReactElement} - Spinner component
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  fullScreen = false,
  className = '',
  text,
  ...rest
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  // Color classes
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
  };
  
  // Base classes
  const baseClasses = [
    'animate-spin',
    sizeClasses[size],
    colorClasses[color],
    className,
  ].join(' ');
  
  const spinner = (
    <svg
      className={baseClasses}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...rest}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
        {text && (
          <p className="mt-4 text-sm font-medium text-gray-700">{text}</p>
        )}
      </div>
    );
  }
  
  if (text) {
    return (
      <div className="flex flex-col items-center">
        {spinner}
        <p className="mt-2 text-sm font-medium text-gray-700">{text}</p>
      </div>
    );
  }
  
  return spinner;
};

export default Spinner;
