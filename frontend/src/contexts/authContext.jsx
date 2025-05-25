import React, { createContext, useState, useEffect } from 'react';
import AuthAPI from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for stored token
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Try to get current user with stored token
          const currentUser = await AuthAPI.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          console.error('Error initializing auth state:', error);
          logout();
        }
      }
      
      setLoading(false);
      setInitialized(true);
    };
    
    initializeAuth();
  }, []);
  
  // Login user
  const login = async (email, password) => {
    const data = await AuthAPI.createSession({ email, password });
    setUser(data.user);
    return data;
  };
  
  // Logout user
  const logout = () => {
    AuthAPI.deleteSession();
    setUser(null);
  };
  
  // Update user info
  const updateUser = (userData) => {
    setUser({ ...user, ...userData });
    // Update stored user data
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...storedUser, ...userData }));
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      initialized,
      login, 
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};