import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { MailIcon } from '@heroicons/react/outline';
import { Input, Button, Card } from '../common';
import useAuth from '../../hooks/useAuth';

const ForgotPasswordForm = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
  });
  
  // Form initialization
  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const result = await forgotPassword(values.email);
        if (result.success) {
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error('Forgot password error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });
  
  if (isSubmitted) {
    return (
      <Card>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              We've sent a password reset link to <strong>{formik.values.email}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </p>
          </div>
          <div className="mt-6">
            <Button variant="outline" to="/login">
              Return to login
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Forgot your password?</h2>
      <p className="mt-1 text-sm text-gray-600">
        No worries, we'll send you reset instructions.
      </p>
      
      <form className="mt-6 space-y-6" onSubmit={formik.handleSubmit}>
        <div>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="Enter your email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email}
            disabled={isLoading}
            required
            icon={<MailIcon className="h-5 w-5 text-gray-400" />}
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
            Send reset instructions
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
  );
};

export default ForgotPasswordForm;
