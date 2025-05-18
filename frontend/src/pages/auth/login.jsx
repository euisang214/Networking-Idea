import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth';
import useAuth from '../../hooks/useAuth';

const Login = () => {
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
        <title>Login | MentorConnect</title>
        <meta name="description" content="Login to your MentorConnect account" />
      </Helmet>
      
      <LoginForm />
    </>
  );
};

export default Login;
