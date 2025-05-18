import React from 'react';

/**
 * Input component for text fields, email, password, etc.
 * @param {Object} props - Component props
 * @param {string} props.id - Input id attribute
 * @param {string} props.name - Input name attribute
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} [props.label] - Input label text
 * @param {string} [props.placeholder] - Input placeholder text
 * @param {string} [props.value] - Input value
 * @param {function} [props.onChange] - Change handler
 * @param {function} [props.onBlur] - Blur handler
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {boolean} [props.readOnly=false] - Whether the input is read-only
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.helpText] - Helper text to display below input
 * @param {boolean} [props.fullWidth=true] - Whether the input should take up the full width
 * @param {string} [props.className] - Additional CSS classes for the input container
 * @param {string} [props.inputClassName] - Additional CSS classes for the input element
 * @param {React.ReactNode} [props.icon] - Icon to display inside the input
 * @param {string} [props.iconPosition='left'] - Position of the icon (left, right)
 * @returns {React.ReactElement} - Input component
 */
const Input = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  fullWidth = true,
  className = '',
  inputClassName = '',
  icon,
  iconPosition = 'left',
  ...rest
}) => {
  // Base container classes
  const containerClasses = [
    'relative',
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');
  
  // Base input classes
  const baseInputClasses = [
    'appearance-none block rounded-md shadow-sm',
    'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
    fullWidth ? 'w-full' : '',
    icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
    disabled ? 'bg-gray-100 cursor-not-allowed' : '',
    error ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:ring-danger-500 focus:border-danger-500' : '',
    inputClassName,
  ].join(' ');
  
  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${error ? 'text-danger-600' : 'text-gray-700'} mb-1`}
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          id={id}
          name={name}
          type={type}
          className={baseInputClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          {...rest}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-danger-600" id={`${id}-error`}>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500" id={`${id}-help`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Input;
