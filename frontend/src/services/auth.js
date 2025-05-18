import apiService from './api';
import jwtDecode from 'jwt-decode';

// Constants
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

// Get tokens from local storage
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Set tokens in local storage
export const setTokens = (accessToken, refreshToken, user) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear tokens from local storage
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (decoded.exp < currentTime) {
      // Token is expired, try to refresh
      refreshTokens().catch(() => {
        clearTokens();
        return false;
      });
    }
    
    return true;
  } catch (error) {
    console.error('Invalid token:', error);
    clearTokens();
    return false;
  }
};

// Check if the user has a specific role
export const hasRole = (role) => {
  const user = getUser();
  return user && user.role === role;
};

// Refresh tokens
export const refreshTokens = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    
    const response = await apiService.post('/auth/refresh', { refreshToken });
    
    if (response.accessToken) {
      // Update access token in local storage
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      
      // Update refresh token if provided
      if (response.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    clearTokens();
    return false;
  }
};

// Authentication API calls
const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData);
    
    if (response.accessToken && response.refreshToken && response.user) {
      setTokens(response.accessToken, response.refreshToken, response.user);
    }
    
    return response;
  },
  
  // Login user
  login: async (credentials) => {
    const response = await apiService.post('/auth/login', credentials);
    
    if (response.accessToken && response.refreshToken && response.user) {
      setTokens(response.accessToken, response.refreshToken, response.user);
    }
    
    return response;
  },
  
  // Logout user
  logout: async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  },
  
  // Reset password
  forgotPassword: async (email) => {
    return await apiService.post('/auth/forgot-password', { email });
  },
  
  // Reset password with token
  resetPassword: async (token, password) => {
    return await apiService.post('/auth/reset-password', { token, password });
  },
  
  // Verify email
  verifyEmail: async (token) => {
    return await apiService.get(`/auth/verify-email/${token}`);
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiService.get('/auth/me');
      
      if (response.user) {
        // Update user in local storage
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
      
      return response.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },
  
  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiService.put('/users/profile', profileData);
    
    if (response.user) {
      // Update user in local storage
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
    
    return response;
  },
};

export default authService;
