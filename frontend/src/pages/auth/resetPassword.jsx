import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { LockClosedIcon } from '@heroicons/react/outline';
import { Input, Button, Card } from '../../components/common';
import useAuth from '../../hooks/useAuth';
import AuthAPI from '../../api/auth';

const ResetPassword = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Get token from query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Redirect to forgot password if no token is provided
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);
  
  // Form validation schema
  const validationSchema = Yup.object({
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });
  
  // Form initialization
  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      setError('');
      
      try {
        const result = await AuthAPI.updatePasswordWithToken(token, values.password);
        
        if (result.success) {
          setIsSubmitted(true);
        } else {
          setError(result.error?.message || 'Failed to reset password');
        }
      } catch (error) {
        setError(error.message || 'An unexpected error occurred');
        console.error('Reset password error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });
  
  if (!token) {
    return null; // Will redirect to forgot password
  }
  
  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Password Reset Successful | MentorConnect</title>
        </Helmet>
        
        <Card>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Password Reset Successful</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Your password has been reset successfully. You can now login with your new password.
              </p>
            </div>
            <div className="mt-6">
              <Button variant="primary" to="/login">
                Go to Login
              </Button>
            </div>
          </div>
        </Card>
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Reset Password | MentorConnect</title>
        <meta name="description" content="Create a new password for your MentorConnect account" />
      </Helmet>
      
      <div>
        <h2 className="text-lg font-medium text-gray-900">Reset your password</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create a new password for your account.
        </p>
        
        {error && (
          <div className="mt-4 p-3 bg-danger-50 text-danger-700 rounded-md">
            {error}
          </div>
        )}
        
        <form className="mt-6 space-y-6" onSubmit={formik.handleSubmit}>
          <div>
            <Input
              id="password"
              name="password"
              type="password"
              label="New password"
              placeholder="Enter your new password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              disabled={isLoading}
              required
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              helpText="Password must be at least 8 characters and contain uppercase, lowercase, and numbers."
            />
          </div>
          
          <div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm password"
              placeholder="Confirm your new password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && formik.errors.confirmPassword}
              disabled={isLoading}
              required
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              isLoading={isLoading}
            >
              Reset password
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Back to login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;
