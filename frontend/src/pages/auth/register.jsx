import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { RegisterForm } from '../../components/auth';
import useAuth from '../../hooks/useAuth';

const Register = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get referral code from query parameters if any
  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get('ref');
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <>
      <Helmet>
        <title>Sign Up | MentorConnect</title>
        <meta name="description" content="Create a new MentorConnect account" />
      </Helmet>
      
      {referralCode && (
        <div className="mb-6 p-4 bg-primary-50 rounded-md">
          <p className="text-sm text-primary-700">
            You've been invited by a friend! Sign up using this form to connect.
          </p>
        </div>
      )}
      
      <RegisterForm referralCode={referralCode} />
    </>
  );
};

export default Register;
