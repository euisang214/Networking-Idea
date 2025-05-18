import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from '../../components/auth';
import useAuth from '../../hooks/useAuth';

const ForgotPassword = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <>
      <Helmet>
        <title>Forgot Password | MentorConnect</title>
        <meta name="description" content="Reset your MentorConnect password" />
      </Helmet>
      
      <ForgotPasswordForm />
    </>
  );
};

export default ForgotPassword;
