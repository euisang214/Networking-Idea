import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Common components
import { Spinner } from './components/common';

// Auth route wrapper
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Spinner fullScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Guest route wrapper (redirects if authenticated)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Spinner fullScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Role-based route wrapper
const RoleRoute = ({ roles, children }) => {
  const { hasRole, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return <Spinner fullScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const hasAccess = roles.some((role) => hasRole(role));
  
  if (!hasAccess) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// Dashboard pages
const SeekerDashboard = lazy(() => import('./pages/dashboard/SeekerDashboard'));
const ProfessionalDashboard = lazy(() => import('./pages/dashboard/ProfessionalDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));

// Professional pages
const ProfessionalListing = lazy(() => import('./pages/professionals/ProfessionalListing'));
const ProfessionalDetail = lazy(() => import('./pages/professionals/ProfessionalDetail'));

// Session pages
const SessionBooking = lazy(() => import('./pages/sessions/SessionBooking'));
const SessionDetail = lazy(() => import('./pages/sessions/SessionDetail'));
const SessionsList = lazy(() => import('./pages/sessions/SessionsList'));
const SessionFeedback = lazy(() => import('./pages/sessions/SessionFeedback'));

// Payment pages
const Checkout = lazy(() => import('./pages/payments/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/payments/Success'));
const PaymentFailed = lazy(() => import('./pages/payments/Failed'));

// Referral pages
const ReferralDashboard = lazy(() => import('./pages/referrals/ReferralDashboard'));
const ReferAFriend = lazy(() => import('./pages/referrals/ReferAFriend'));

// Profile pages
const Profile = lazy(() => import('./pages/profile/Profile'));
const EditProfile = lazy(() => import('./pages/profile/EditProfile'));
const ProfessionalProfile = lazy(() => import('./pages/profile/ProfessionalProfile'));

// Settings pages
const Settings = lazy(() => import('./pages/settings/Settings'));
const NotificationSettings = lazy(() => import('./pages/settings/Notifications'));

const AppRoutes = () => {
  const { isSeeker, isProfessional, isAdmin } = useAuth();
  
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <Routes>
        {/* Public routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Professional listing (public with limited view) */}
          <Route path="/professionals" element={<ProfessionalListing />} />
          <Route path="/professionals/:id" element={<ProfessionalDetail />} />
        </Route>
        
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>
        
        {/* Dashboard routes */}
        <Route
          element={
            <AuthRoute>
              <DashboardLayout />
            </AuthRoute>
          }
        >
          {/* Dynamic dashboard based on user role */}
          <Route
            path="/dashboard"
            element={
              isAdmin ? (
                <AdminDashboard />
              ) : isProfessional ? (
                <ProfessionalDashboard />
              ) : (
                <SeekerDashboard />
              )
            }
          />
          
          {/* Session routes */}
          <Route path="/sessions" element={<SessionsList />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route
            path="/sessions/book/:professionalId"
            element={
              <RoleRoute roles={['seeker']}>
                <SessionBooking />
              </RoleRoute>
            }
          />
          <Route path="/sessions/:id/feedback" element={<SessionFeedback />} />
          
          {/* Payment routes */}
          <Route
            path="/checkout/:sessionId"
            element={
              <RoleRoute roles={['seeker']}>
                <Checkout />
              </RoleRoute>
            }
          />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          
          {/* Referral routes */}
          <Route path="/referrals" element={<ReferralDashboard />} />
          <Route path="/refer" element={<ReferAFriend />} />
          
          {/* Profile routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route
            path="/professional-profile"
            element={
              <RoleRoute roles={['professional']}>
                <ProfessionalProfile />
              </RoleRoute>
            }
          />
          
          {/* Settings routes */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
