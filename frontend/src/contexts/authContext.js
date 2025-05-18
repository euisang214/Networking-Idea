import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService, {
  getUser,
  isAuthenticated,
  hasRole,
  clearTokens
} from '../services/auth';

// Create AuthContext
export const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  
  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (initialized) return;
    
    setLoading(true);
    
    try {
      if (isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // If getCurrentUser fails, clear tokens
          clearTokens();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized]);
  
  // Effect to initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Login handler
  const login = async (credentials) => {
    setLoading(true);
    
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      toast.success('Logged in successfully');
      return { success: true, user: response.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Register handler
  const register = async (userData) => {
    setLoading(true);
    
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      toast.success('Registration successful!');
      return { success: true, user: response.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout handler
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      clearTokens();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
      return { success: true };
    } catch (error) {
      toast.error('Logout failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      toast.success('Profile updated successfully');
      return { success: true, user: response.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password request
  const forgotPassword = async (email) => {
    setLoading(true);
    
    try {
      await authService.forgotPassword(email);
      toast.success('Password reset instructions sent to your email');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset instructions');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password with token
  const resetPassword = async (token, password) => {
    setLoading(true);
    
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successful');
      navigate('/login');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Verify email
  const verifyEmail = async (token) => {
    setLoading(true);
    
    try {
      const response = await authService.verifyEmail(token);
      toast.success('Email verified successfully');
      
      // If user is already logged in, update user data
      if (user) {
        setUser({ ...user, is_verified: true });
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify email');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has specific role
  const checkRole = useCallback((role) => {
    return user ? hasRole(role) : false;
  }, [user]);
  
  // Context value
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSeeker: user?.role === 'seeker',
    isProfessional: user?.role === 'professional',
    isAdmin: user?.role === 'admin',
    hasRole: checkRole,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    initializeAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
