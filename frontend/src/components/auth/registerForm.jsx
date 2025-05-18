import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  LockClosedIcon,
  MailIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/outline';
import { Input, Button, Spinner } from '../common';
import useAuth from '../../hooks/useAuth';

const RegisterForm = () => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Form validation schema
  const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
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
    role: Yup.string()
      .oneOf(['seeker', 'professional'], 'Invalid role')
      .required('Role is required'),
    termsAccepted: Yup.boolean().oneOf(
      [true],
      'You must accept the terms and conditions'
    ),
  });
  
  // Form initialization
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'seeker',
      termsAccepted: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        // Transform form values to match API format
        const userData = {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          password: values.password,
          role: values.role,
        };
        
        const result = await register(userData);
        
        if (result.success) {
          // Redirect to dashboard or verification page
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Registration error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });
  
  return (
    <form className="space-y-6" onSubmit={formik.handleSubmit}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            label="First name"
            placeholder="Enter your first name"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.firstName && formik.errors.firstName}
            disabled={isLoading}
            required
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
          />
        </div>
        
        <div>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            label="Last name"
            placeholder="Enter your last name"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.lastName && formik.errors.lastName}
            disabled={isLoading}
            required
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
          />
        </div>
      </div>
      
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
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
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
          placeholder="Confirm your password"
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
        <label className="block text-sm font-medium text-gray-700">
          I am a:
        </label>
        <div className="mt-2 space-y-4">
          <div className="flex items-center">
            <input
              id="role-seeker"
              name="role"
              type="radio"
              value="seeker"
              checked={formik.values.role === 'seeker'}
              onChange={formik.handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="role-seeker" className="ml-3 block text-sm font-medium text-gray-700">
              Job Seeker / Mentee (I'm looking for guidance)
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="role-professional"
              name="role"
              type="radio"
              value="professional"
              checked={formik.values.role === 'professional'}
              onChange={formik.handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="role-professional" className="ml-3 block text-sm font-medium text-gray-700">
              Professional / Mentor (I want to offer guidance)
            </label>
          </div>
        </div>
        {formik.touched.role && formik.errors.role && (
          <p className="mt-2 text-sm text-danger-600">{formik.errors.role}</p>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          id="termsAccepted"
          name="termsAccepted"
          type="checkbox"
          checked={formik.values.termsAccepted}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
          I agree to the{' '}
          <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
            Terms and Conditions
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
            Privacy Policy
          </Link>
        </label>
      </div>
      {formik.touched.termsAccepted && formik.errors.termsAccepted && (
        <p className="text-sm text-danger-600">{formik.errors.termsAccepted}</p>
      )}
      
      <div>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading}
          isLoading={isLoading}
        >
          Sign up
        </Button>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
