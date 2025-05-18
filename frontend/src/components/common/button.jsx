import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Button component that supports different variants, sizes, and can render as a button or link
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, danger, success, text)
 * @param {string} [props.size='md'] - Button size (xs, sm, md, lg, xl)
 * @param {boolean} [props.fullWidth=false] - Whether the button should take up the full width
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.type='button'] - Button type attribute (button, submit, reset)
 * @param {string} [props.to] - Link destination (renders as Link component if provided)
 * @param {string} [props.href] - External URL (renders as anchor tag if provided)
 * @param {function} [props.onClick] - Click handler
 * @param {boolean} [props.isLoading=false] - Whether to show loading state
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} - Button or link component
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  to,
  href,
  onClick,
  isLoading = false,
  children,
  className = '',
  ...rest
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors duration-200';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-2 focus:ring-offset-2 focus:ring-danger-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-2 focus:ring-offset-2 focus:ring-success-500',
    text: 'text-primary-600 hover:text-primary-700 bg-transparent',
  };
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base',
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  // Full width class
  const fullWidthClass = 'w-full';
  
  // Loading indicator
  const loadingIndicator = (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
  
  // Assemble the final class names
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? fullWidthClass : '',
    disabled || isLoading ? disabledClasses : '',
    className,
  ].join(' ');
  
  // Render as Link component for internal navigation
  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {isLoading && loadingIndicator}
        {children}
      </Link>
    );
  }
  
  // Render as anchor tag for external links
  if (href && !disabled) {
    return (
      <a href={href} className={classes} {...rest}>
        {isLoading && loadingIndicator}
        {children}
      </a>
    );
  }
  
  // Otherwise render as button
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...rest}
    >
      {isLoading && loadingIndicator}
      {children}
    </button>
  );
};

export default Button;
