// services/authService.js
import axios from 'axios';
import tokenManager from '../utils/tokenManager';

// More robust API URL handling
let apiUrl = import.meta.env.VITE_API_URL;

// Handle common deployment issues with environment variables
if (typeof apiUrl === 'string') {
  // Fix case where the variable name is included in the value
  if (apiUrl.startsWith('VITE_API_URL=')) {
    apiUrl = apiUrl.replace('VITE_API_URL=', '');
    console.log('Fixed API URL format (removed variable name):', apiUrl);
  }
  
  // Fix case where there might be quotes in the string
  apiUrl = apiUrl.replace(/^["'](.+)["']$/, '$1');
  
  // Fix case where API path might be duplicated
  if (apiUrl.includes('/api/v1/api/v1')) {
    apiUrl = apiUrl.replace('/api/v1/api/v1', '/api/v1');
    console.log('Fixed duplicate API path:', apiUrl);
  }
}

// Fallback to known deployed backend if variable is missing
const API_URL = apiUrl || 'https://maldives-activity-booking-backend.onrender.com/api/v1';
console.log('Using API URL:', API_URL);

// Configure axios with credentials
axios.defaults.withCredentials = true;

// Set consistent headers for all requests
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Create a configured axios instance
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Register new user
export const register = async (userData) => {
  try {
    console.log('Attempting to register with data:', {
      ...userData,
      password: '[REDACTED]'
    });
    
    const response = await API.post('/auth/register', userData);
    console.log('Registration response:', response.data);
    
    if (response.data) {
      console.log('Authentication response received from server');
      
      const saveResult = tokenManager.saveAuthData(response.data);
      
      if (saveResult) {
        console.log('Authentication data successfully saved');
        
        const token = tokenManager.getToken();
        if (token) {
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Authorization header set for subsequent requests');
        }
      } else {
        console.error('Failed to save authentication data');
      }
    } else {
      console.error('Empty response data received from registration');
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    console.error('Full error details:', error);
    
    console.log('Network error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      isCORSError: error.message?.includes('CORS')
    });
    
    if (error.config) {
      console.log('Request that failed:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        withCredentials: error.config.withCredentials,
        headers: { 
          ...error.config.headers, 
          Authorization: error.config.headers?.Authorization ? '[PRESENT]' : '[NOT PRESENT]' 
        },
      });
    }
    
    throw error;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    console.log('Attempting login for email:', email);
    
    const response = await API.post('/auth/login', { email, password });
    console.log('Login response:', response.data);
    
    if (response.data) {
      const saveResult = tokenManager.saveAuthData(response.data);
      
      if (saveResult) {
        console.log('Login successful - auth data saved');
        
        const token = tokenManager.getToken();
        if (token) {
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Authorization header set after login');
        }
      } else {
        console.error('Failed to save login authentication data');
      }
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    console.error('Full error details:', error);
    
    if (error.config) {
      console.log('Request that failed:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      });
    }
    
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    console.log('Logging out user...');
    await API.get('/auth/logout');
    console.log('Logout API call successful');
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API fails
  }
  
  // Use tokenManager to clear auth data
  tokenManager.clearAuth();
  
  // Also clear the authorization header
  delete API.defaults.headers.common['Authorization'];
  console.log('User logged out successfully');
};

// Get current user
export const getCurrentUser = async () => {
  const token = tokenManager.getToken();
  
  if (!token) {
    console.log('No token available, user is not authenticated');
    return null;
  }

  try {
    console.log('Fetching current user data...');
    const response = await API.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.data) {
      console.log('User data retrieved successfully');
      return response.data.data;
    } else {
      console.warn('User data endpoint returned unexpected format');
      return null;
    }
  } catch (error) {
    console.error('Get current user error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('Token invalid or expired, clearing auth data');
      tokenManager.clearAuth();
    }
    
    return null;
  }
};

// Update user profile
export const updateProfile = async (userData) => {
  const response = await API.put('/auth/updatedetails', userData);
  return response.data;
};

// Update password
export const updatePassword = async (passwordData) => {
  const response = await API.put('/auth/updatepassword', passwordData);
  return response.data;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await API.post('/auth/forgotpassword', { email });
  return response.data;
};

// Reset password
export const resetPassword = async (token, password) => {
  const response = await API.put(`/auth/resetpassword/${token}`, { password });
  return response.data;
};

// ==================== ADD THESE NEW FUNCTIONS ====================

// Validate session (for auto-logout)
export const validateSession = async () => {
  try {
    console.log('🔍 Validating session with server...');
    const response = await API.get('/auth/validate-session');
    console.log('✅ Session validation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Session validation error:', error.response?.data || error.message);
    throw error;
  }
};

// Refresh session (reset inactivity timer)
export const refreshSession = async () => {
  try {
    console.log('🔄 Refreshing session with server...');
    const response = await API.post('/auth/refresh-session');
    console.log('✅ Session refresh response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Session refresh error:', error.response?.data || error.message);
    throw error;
  }
};

// Setup axios interceptor for adding token to requests
export const setupAxiosInterceptors = () => {
  console.log('Setting up axios interceptors for authentication');
  
  // Setup request interceptor with enhanced token handling
  API.interceptors.request.use(
    (config) => {
      // Always ensure credentials are sent
      config.withCredentials = true;
      
      // Ensure common headers are set for all requests
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header with token if available - using tokenManager
      const token = tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Request to ${config.url} includes Authorization header`);
      } else {
        console.log(`No token available for request to ${config.url}`);
      }
      
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Setup response interceptor with better error handling
  API.interceptors.response.use(
    (response) => {
      // Check for token in response and save it if present
      if (response.data?.token && !localStorage.getItem('token')) {
        console.log('Token received in response, storing in localStorage');
        localStorage.setItem('token', response.data.token);
        
        // Set for future requests
        API.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      // Check for user data in response
      if (response.data?.user && !localStorage.getItem('user')) {
        console.log('User data received in response, storing in localStorage');
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    },
    (error) => {
      // Handle specific API errors
      if (error.response) {
        const { status, data } = error.response;
        
        console.error(`API Error ${status}:`, data);
        
        if (status === 401) {
          // Unauthorized - clear token and redirect to login
          console.warn('Authentication error: User not authenticated or token expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only redirect if not already on auth pages
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            console.log('Redirecting to login page due to authentication error');
            window.location.href = '/login';
          }
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        console.error('Network error: No response received from server', error.request);
      }
      
      return Promise.reject(error);
    }
  );
  
  console.log('Axios interceptors setup complete');
};