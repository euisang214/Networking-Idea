import React from 'react';

/**
 * Card component for displaying content in a card container
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} [props.header] - Card header content
 * @param {React.ReactNode} [props.footer] - Card footer content
 * @param {boolean} [props.hover=false] - Whether to show hover effect
 * @param {boolean} [props.clickable=false] - Whether the card is clickable
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.bodyClassName] - Additional CSS classes for the card body
 * @returns {React.ReactElement} - Card component
 */
const Card = ({
  children,
  header,
  footer,
  hover = false,
  clickable = false,
  onClick,
  className = '',
  bodyClassName = '',
  ...rest
}) => {
  // Base classes
  const baseClasses = [
    'bg-white',
    'overflow-hidden',
    'shadow-sm',
    'rounded-lg',
    'border border-gray-200',
  ];
  
  // Hover classes
  if (hover) {
    baseClasses.push('transition-all duration-200 hover:shadow-md');
  }
  
  // Clickable classes
  if (clickable) {
    baseClasses.push('cursor-pointer');
  }
  
  // Custom classes
  if (className) {
    baseClasses.push(className);
  }
  
  const cardProps = {
    className: baseClasses.join(' '),
    ...(clickable ? { onClick } : {}),
    ...rest,
  };
  
  return (
    <div {...cardProps}>
      {header && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
          {header}
        </div>
      )}
      <div className={`px-4 py-5 sm:p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
