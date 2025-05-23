import React from 'react';
import PropTypes from 'prop-types';

const FileInput = ({
  label,
  name,
  id,
  onChange,
  accept,
  required = false,
  error,
  containerClassName = '',
  labelClassName = ''
}) => {
  const inputId = id || name;

  return (
    <div className={`mb-4 ${containerClassName}`}>\n      {label && (
        <label htmlFor={inputId} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>\n          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="file"
        id={inputId}
        name={name}
        accept={accept}
        onChange={onChange}
        required={required}
        className={`
          w-full text-gray-700
          file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

FileInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  accept: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  containerClassName: PropTypes.string,
  labelClassName: PropTypes.string
};

export default FileInput;
