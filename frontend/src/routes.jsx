import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';



// Admin Components
import AdminLayout from './components/admin/adminLayout';
import AdminDashboard from './pages/admin/adminDashboard';
import SessionManagement from './pages/admin/sessionManagement';
import ReferralManagement from './pages/admin/referralManagement';
import UserManagement from './pages/admin/userManagement';
import Analytics from './pages/admin/analytics';

// Layouts
import MainLayout from './layouts/mainLayout';
import AuthLayout from './layouts/authLayout';
import DashboardLayout from './layouts/dashboardLayout';

// Public pages
import Home from './pages/Home';
import ProfessionalsPage from './pages/professionalsPage';
import ProfessionalDetailPage from './pages/professionalDetails';

// Auth pages
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import ForgotPassword from './pages/auth/forgotPassword';
import ResetPassword from './pages/auth/resetPassword';
import VerifyEmail from './pages/auth/verifyEmail';

// Protected pages
import SessionsPage from './pages/sessionsPage';
import SessionDetailPage from './pages/sessionDetailPage';
import ReferralHistoryPage from './pages/ReferralHistory';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import JobOffersPage from './pages/jobOffersPage';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome';
import DashboardSessions from './pages/dashboard/DashboardSessions';
import DashboardReferrals from './pages/dashboard/DashboardReferrals';
import DashboardEarnings from './pages/dashboard/DashboardEarnings';
import DashboardProfile from './pages/dashboard/DashboardProfile';
import DashboardSettings from './pages/dashboard/DashboardSettings';

// Private route component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes with main layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="professionals" element={<ProfessionalsPage />} />
        <Route path="professionals/:id" element={<ProfessionalDetailPage />} />
        
        {/* Protected routes */}
        <Route path="sessions" element={
          <PrivateRoute>
            <SessionsPage />
          </PrivateRoute>
        } />
        <Route path="sessions/:sessionId" element={
          <PrivateRoute>
            <SessionDetailPage />
          </PrivateRoute>
        } />
        <Route path="referrals" element={
          <PrivateRoute>
            <ReferralHistoryPage />
          </PrivateRoute>
        } />
        <Route path="job-offers" element={
          <PrivateRoute>
            <JobOffersPage />
          </PrivateRoute>
        } />
        <Route path="profile" element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } />
        <Route path="settings" element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        } />
        <Route path="messages" element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        } />
        <Route path="notifications" element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        } />
      </Route>
      
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Admin routes */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="sessions" element={<SessionManagement />} />
        <Route path="referrals" element={<ReferralManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      
      {/* Dashboard routes */}
      <Route path="dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="sessions" element={<DashboardSessions />} />
        <Route path="referrals" element={<DashboardReferrals />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="earnings" element={<DashboardEarnings />} />
        <Route path="profile" element={<DashboardProfile />} />
        <Route path="settings" element={<DashboardSettings />} />
      </Route>
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;