import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/outline';
import { Button, Card, Spinner } from '../../components/common';
import { useAuth } from '../../hooks';
import AuthAPI from '../../api/auth';

const VerifyEmail = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState('');
  
  // Get token from query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Verify the email on component mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerificationStatus('error');
        setError('Verification token is missing');
        setIsLoading(false);
        return;
      }
      
      try {
        const result = await AuthAPI.updateEmailVerification(token);
        
        if (result.success) {
          setVerificationStatus('success');
        } else {
          setVerificationStatus('error');
          setError(result.error?.message || 'Failed to verify email');
        }
      } catch (error) {
        setVerificationStatus('error');
        setError(error.message || 'An unexpected error occurred');
        console.error('Email verification error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    verify();
  }, [token]);
  
  // Render different content based on verification status
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      );
    }
    
    if (verificationStatus === 'success') {
      return (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
            <CheckCircleIcon className="h-8 w-8 text-success-600" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Email Verified Successfully</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Your email has been verified successfully. You can now use all features of your account.
              </p>
            </div>
            <div className="mt-6 space-x-3">
              {isAuthenticated ? (
                <Button variant="primary" to="/dashboard">
                  Go to Dashboard
                </Button>
              ) : (
                <Button variant="primary" to="/login">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    if (verificationStatus === 'error') {
      return (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100">
            <XCircleIcon className="h-8 w-8 text-danger-600" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Email Verification Failed</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {error || 'The verification link is invalid or has expired.'}
              </p>
            </div>
            <div className="mt-6 space-x-3">
              <Button variant="outline" to="/login">
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Verify Email | MentorConnect</title>
        <meta name="description" content="Verify your email address for MentorConnect" />
      </Helmet>
      
      <Card>{renderContent()}</Card>
    </>
  );
};

export default VerifyEmail;
