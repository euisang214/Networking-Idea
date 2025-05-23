import { useState } from 'react';

export const useForm = (initialState, submitCallback, validateForm) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Handle different input types
    let inputValue;
    if (type === 'checkbox') inputValue = checked;
    else if (type === 'file') inputValue = files[0];
    else inputValue = value;
    
    setValues({
      ...values,
      [name]: inputValue
    });
    
    setTouched({
      ...touched,
      [name]: true
    });
    
    // Validate field on change if validation function exists
    if (validateForm) {
      const validation = validateForm({
        ...values,
        [name]: inputValue
      });
      
      if (validation[name]) {
        setErrors({
          ...errors,
          [name]: validation[name]
        });
      } else {
        const { [name]: removed, ...rest } = errors;
        setErrors(rest);
      }
    }
  };
  
  // Handle blur event for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    
    setTouched({
      ...touched,
      [name]: true
    });
    
    // Validate field on blur if validation function exists
    if (validateForm) {
      const validation = validateForm(values);
      
      if (validation[name]) {
        setErrors({
          ...errors,
          [name]: validation[name]
        });
      } else {
        const { [name]: removed, ...rest } = errors;
        setErrors(rest);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // Validate all fields
    if (validateForm) {
      const validation = validateForm(values);
      
      if (Object.keys(validation).length > 0) {
        setErrors(validation);
        
        // Mark all fields as touched
        const allTouched = {};
        Object.keys(values).forEach(key => {
          allTouched[key] = true;
        });
        setTouched(allTouched);
        
        return;
      }
    }
    
    // Submit form if no errors
    submitCallback();
  };
  
  // Reset form to initial state
  const resetForm = () => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  };
  
  // Set form values programmatically
  const setFormValues = (newValues) => {
    setValues({
      ...values,
      ...newValues
    });
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormValues
  };
};