import axios from 'axios';
import { getAccessToken, clearTokens, refreshTokens } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const success = await refreshTokens();
        
        if (success) {
          // If token refresh is successful, retry the original request
          const token = getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          // If token refresh fails, clear tokens and redirect to login
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If token refresh fails, clear tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic API request methods
const apiService = {
  // GET request
  get: async (endpoint, params = {}) => {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  
  // POST request
  post: async (endpoint, data = {}) => {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  
  // PUT request
  put: async (endpoint, data = {}) => {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  
  // PATCH request
  patch: async (endpoint, data = {}) => {
    try {
      const response = await api.patch(endpoint, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  
  // DELETE request
  delete: async (endpoint) => {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  
  // Upload file
  upload: async (endpoint, formData, onProgress) => {
    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
  
  // Set base URL
  setBaseURL: (url) => {
    api.defaults.baseURL = url;
  },
  
  // Set default headers
  setHeaders: (headers) => {
    Object.keys(headers).forEach((key) => {
      api.defaults.headers.common[key] = headers[key];
    });
  },
};

// Error handling helper
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error Response:', error.response.data);
    
    // Handle specific error codes
    switch (error.response.status) {
      case 400: // Bad Request
        console.error('Bad Request:', error.response.data.message || 'Invalid request');
        break;
      case 401: // Unauthorized
        console.error('Unauthorized:', error.response.data.message || 'Authentication required');
        break;
      case 403: // Forbidden
        console.error('Forbidden:', error.response.data.message || 'Access denied');
        break;
      case 404: // Not Found
        console.error('Not Found:', error.response.data.message || 'Resource not found');
        break;
      case 422: // Validation Error
        console.error('Validation Error:', error.response.data.message || 'Validation failed');
        break;
      case 500: // Server Error
        console.error('Server Error:', error.response.data.message || 'Internal server error');
        break;
      default:
        console.error(`Error ${error.response.status}:`, error.response.data.message || 'API error');
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Request Error:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Error:', error.message);
  }
};

export default apiService;
