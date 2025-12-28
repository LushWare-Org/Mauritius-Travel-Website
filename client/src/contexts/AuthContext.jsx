import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  getCurrentUser, 
  login as loginService, 
  logout as logoutService, 
  register as registerService,
  forgotPassword as forgotPasswordService, 
  resetPassword as resetPasswordService,
  updateProfile as updateProfileService, 
  updatePassword as updatePasswordService,
  setupAxiosInterceptors,
  validateSession // Add this import for session validation
} from '../services/authService';
import tokenManager from '../utils/tokenManager';

// Setup axios interceptors for authentication
setupAxiosInterceptors();

// Create auth context
const AuthContext = createContext();

// Helper function to save user to localStorage
const saveUserToStorage = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// Helper function to get user from localStorage
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    localStorage.removeItem('user');
    return null;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stable setter for currentUser that updates localStorage
  const setCurrentUserWithPersistence = useCallback((user) => {
    console.log('Setting current user:', user?.name || 'null');
    setCurrentUser(user);
    saveUserToStorage(user);
    
    // Update token manager if we have a user
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        tokenManager.setToken(token);
      }
    }
  }, []);

  // ==================== MOVE LOGOUT FUNCTION UP HERE ====================
  // Logout user - moved BEFORE useEffect to avoid reference error
  const logout = useCallback(async () => {
    try {
      console.log('👋 Logging out user:', currentUser?.name || 'Unknown user');
      await logoutService();
    } catch (err) {
      console.error('Server logout error:', err);
      // Continue with client-side cleanup even if server fails
    } finally {
      // ALWAYS clear client-side data
      setCurrentUserWithPersistence(null);
      tokenManager.clearAuth();
      localStorage.removeItem('token');
      console.log('✅ Logout complete');
    }
  }, [currentUser, setCurrentUserWithPersistence]);

  // Check if user is logged in on page load - SIMPLIFIED
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // 1. First, check localStorage for immediate UI
        const storedUser = getUserFromStorage();
        const token = localStorage.getItem('token');
        
        console.log('Initial auth check:', {
          hasStoredUser: !!storedUser,
          hasToken: !!token
        });
        
        // 2. Set stored user immediately for fast UI
        if (storedUser) {
          console.log('Using cached user data:', storedUser.name);
          setCurrentUser(storedUser);
        }
        
        // 3. If we have a token, validate with server
        if (token) {
          try {
            console.log('Validating token with server...');
            const freshUser = await getCurrentUser();
            
            if (freshUser) {
              console.log('Server validation successful:', freshUser.name);
              setCurrentUserWithPersistence(freshUser);
            } else {
              console.log('Server validation failed, clearing auth data');
              // Clear invalid data
              setCurrentUserWithPersistence(null);
              tokenManager.clearAuth();
            }
          } catch (serverError) {
            console.error('Server validation error:', serverError);
            // Keep cached user if server is down, but mark as potentially stale
            console.log('Using cached data due to server error');
          }
        } else {
          // No token, clear any stale user data
          console.log('No auth token found, clearing user data');
          setCurrentUserWithPersistence(null);
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        // Clear potentially corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
      } finally {
        console.log('✅ Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setCurrentUserWithPersistence]);

  // ==================== AUTO-LOGOUT MECHANISM ====================
  useEffect(() => {
    let sessionCheckInterval;
    let inactivityTimer;

    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Set new timer for 1 hour (60 minutes)
      inactivityTimer = setTimeout(() => {
        console.log('🕐 User inactive for 1 hour, auto-logout triggered');
        handleAutoLogout();
      }, 60 * 60 * 1000); // 1 hour in milliseconds (2 mins for testing)
    };

    const handleUserActivity = () => {
      if (currentUser) {
        console.log('🎯 User activity detected, resetting inactivity timer');
        resetInactivityTimer();
      }
    };

    const handleAutoLogout = async () => {
      console.log('👋 Auto-logout initiated for:', currentUser?.name || 'Unknown user');
      try {
        await logout();
        // Redirect to login with message
        window.location.href = '/login?message=auto_logout&reason=inactivity';
      } catch (error) {
        console.error('Auto-logout error:', error);
        // Force clear local state even if logout fails
        setCurrentUserWithPersistence(null);
        tokenManager.clearAuth();
        localStorage.removeItem('token');
        window.location.href = '/login?message=auto_logout_failed';
      }
    };

    const checkSessionWithServer = async () => {
      if (!currentUser) return;
      
      try {
        console.log('🔍 Checking session validity with server...');
        const response = await validateSession(); // Make sure this API exists in authService
        if (!response.data.valid) {
          console.log('🕐 Server session expired, logging out');
          handleAutoLogout();
        }
      } catch (error) {
        // Session validation failed, could be expired
        if (error.response?.status === 401) {
          console.log('🕐 Session validation failed (401), logging out');
          handleAutoLogout();
        } else {
          console.warn('⚠️ Session check error (non-401):', error.message);
          // Don't logout for network errors, just log warning
        }
      }
    };

    // Only setup timers if user is logged in
    if (currentUser) {
      console.log('⏰ Setting up auto-logout timers for user:', currentUser.name);
      
      // Reset timer on user activity
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });

      // Set initial timer
      resetInactivityTimer();

      // Check session with server every 5 minutes
      sessionCheckInterval = setInterval(checkSessionWithServer, 5 * 60 * 1000);

      // Initial check
      checkSessionWithServer();

      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up auto-logout timers');
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
        }
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [currentUser, logout, setCurrentUserWithPersistence]);
  // ==================== END AUTO-LOGOUT MECHANISM ====================

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await registerService(userData);
      setCurrentUserWithPersistence(data.user);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      const data = await loginService(email, password);
      
      if (data && data.user) {
        console.log('✅ Login successful for:', data.user.name);
        
        // CRITICAL: Store token in localStorage immediately
        if (data.token) {
          localStorage.setItem('token', data.token);
          tokenManager.setToken(data.token);
        }
        
        // Update user state with persistence
        setCurrentUserWithPersistence(data.user);
        
        // Reset inactivity timer by triggering user activity
        window.dispatchEvent(new Event('click'));
        
        return data;
      } else {
        throw new Error('Login response missing user data');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Invalid credentials';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      return await forgotPasswordService(email);
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending reset email');
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      return await resetPasswordService(token, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const data = await updateProfileService(userData);
      setCurrentUserWithPersistence(data.data);
      return data;
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
      throw err;
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      await updatePasswordService(passwordData);
    } catch (err) {
      setError(err.response?.data?.error || 'Password update failed');
      throw err;
    }
  };

  // Clear any error
  const clearError = () => setError(null);

  // Refresh user data from server
  const refreshUserData = async () => {
    try {
      const freshUser = await getCurrentUser();
      if (freshUser) {
        setCurrentUserWithPersistence(freshUser);
        return freshUser;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    return null;
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    refreshUserData,
    setError,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};