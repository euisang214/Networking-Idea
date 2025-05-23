import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import AuthAPI from '../../api/auth';
import Input from '../../common/Input';
import FileInput from '../../common/FileInput';
import Button from '../../common/Button';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  // Initialize form state with useForm hook
  const { values, handleChange, handleSubmit, errors } = useForm(
    {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'candidate', // Default user type
      resume: null
    },
    handleRegister,
    validateRegister
  );
  
  // Form validation function
  function validateRegister(values) {
    const errors = {};
    
    if (!values.firstName) {
      errors.firstName = 'First name is required';
    }
    
    if (!values.lastName) {
      errors.lastName = 'Last name is required';
    }
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (values.resume && values.resume.type && !["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].some(t => values.resume.type.includes(t))) {
      errors.resume = 'Resume must be a PDF or Word document';
    }
    
    return errors;
  }
  
  // Handle register submit
  async function handleRegister() {
    setError('');
    setIsLoading(true);

    try {
      let resumeData = null;
      if (values.resume instanceof File) {
        resumeData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(values.resume);
        });
      }

      await AuthAPI.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        userType: values.userType,
        resume: resumeData
      });
      
      setRegisterSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  if (registerSuccess) {
    return (
      <div className="max-w-md mx-auto text-center">
        <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mt-4 mb-2">Registration Successful!</h2>
        <p className="text-gray-600 mb-6">
          Please check your email to verify your account. A verification link has been sent to {values.email}.
        </p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Create an account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="firstName"
            type="text"
            value={values.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
          />
          
          <Input
            label="Last Name"
            name="lastName"
            type="text"
            value={values.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
          />
        </div>
        
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        
        <Input
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          helpText="Must be at least 8 characters"
          required
        />
        
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        <FileInput
          label="Upload Resume (PDF or Word doc)"
          name="resume"
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleChange}
          error={errors.resume}
        />
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            I am registering as:
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="userType"
                value="candidate"
                checked={values.userType === 'candidate'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Candidate</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="userType"
                value="professional"
                checked={values.userType === 'professional'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">Professional</span>
            </label>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </Link>
          .
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          Sign up
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
