import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from '../../hooks';
import AuthAPI from '../../api/auth';
import Input from '../../common/Input';
import Button from '../../common/Button';

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  
  // Initialize form state with useForm hook
  const { values, handleChange, handleSubmit, errors } = useForm(
    {
      email: ''
    },
    handleResetRequest,
    validateEmail
  );
  
  // Form validation function
  function validateEmail(values) {
    const errors = {};
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    return errors;
  }
  
  // Handle reset request
  async function handleResetRequest() {
    setError('');
    setIsLoading(true);
    
    try {
      await AuthAPI.createPasswordResetRequest(values.email);
      setResetRequested(true);
    } catch (err) {
      // In case of error, we don't want to expose whether the email exists or not for security
      // So we still show success message but log the error
      console.error('Reset request error:', err);
      setResetRequested(true);
    } finally {
      setIsLoading(false);
    }
  }
  
  if (resetRequested) {
    return (
      <div className="max-w-md mx-auto text-center">
        <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mt-4 mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6">
          If an account exists with {values.email}, we've sent instructions to reset your password. 
          Please check your email inbox, including spam or junk folders.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/login'}>
          Return to Login
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">Reset Your Password</h2>
      <p className="text-center text-gray-600 mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          Send Reset Link
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;