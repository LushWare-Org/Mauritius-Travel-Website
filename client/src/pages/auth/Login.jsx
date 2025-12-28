import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, setError, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Add this at the beginning of the Login component
  const [sessionExpired, setSessionExpired] = useState(false);
  const [logoutReason, setLogoutReason] = useState('');

  useEffect(() => {
    // Check URL for session expiry message
    const queryParams = new URLSearchParams(window.location.search);
    const sessionParam = queryParams.get('session');
    const messageParam = queryParams.get('message');
    const authParam = queryParams.get('auth');
    
    if (sessionParam === 'expired' || 
        messageParam === 'auto_logout' ||
        authParam === 'invalid') {
      
      setSessionExpired(true);
      
      // Determine the reason
      if (messageParam === 'auto_logout') {
        setLogoutReason('inactivity');
      } else if (sessionParam === 'expired') {
        setLogoutReason('session_expired');
      } else if (authParam === 'invalid') {
        setLogoutReason('invalid_auth');
      }
      
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Determine where to redirect after login
  const from = location.state?.from || '/';

  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });

  // Handle login
  const handleLogin = async (values, { setSubmitting, setFieldError }) => {
    setIsLoading(true);
    clearError();
    setSessionExpired(false); // Clear session expired message when user tries to login again

    try {
      console.log('🔐 Attempting to login with email:', values.email);
      const result = await login(values.email, values.password);
      console.log('✅ Login successful:', result);

      // Get the user data from result or localStorage
      const userData = result?.user || JSON.parse(localStorage.getItem('user'));
      console.log('👤 User data:', userData);

      // Check if user is admin
      const isAdmin =
        userData?.role === 'admin' || userData?.email === 'mervbn01@gmail.com'; // Add other admin emails if needed

      console.log('🎯 Is admin?', isAdmin);

      // Small delay to ensure state is updated
      setTimeout(() => {
        if (isAdmin) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 100);
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Invalid email or password';
      setError(errorMessage);
      setFieldError('email', errorMessage);
      setFieldError('password', errorMessage);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  // Get appropriate message based on logout reason
  const getSessionExpiredMessage = () => {
    switch (logoutReason) {
      case 'inactivity':
        return 'Your session has expired due to inactivity. Please log in again.';
      case 'session_expired':
        return 'Your session has expired. Please log in again to continue.';
      case 'invalid_auth':
        return 'Your authentication is no longer valid. Please log in again.';
      default:
        return 'Your session has expired. Please log in again.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-md">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 font-display">
              Welcome Back
            </h2>
            <p className="mt-2 text-gray-600">
              Log in to your account to book activities
            </p>
          </div>

          {/* Add this in the return JSX, before the error message */}
          {sessionExpired && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
              <div className="flex items-start">
                <svg 
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.338 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
                <div>
                  <p className="font-medium">Session Expired</p>
                  <p className="mt-1">{getSessionExpiredMessage()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              <div className="flex items-start">
                <svg 
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Email/Password Login Form */}
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      errors.email && touched.email
                        ? 'border-red-300'
                        : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Email address"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-sm text-red-600 mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      errors.password && touched.password
                        ? 'border-red-300'
                        : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Password"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-sm text-red-600 mt-1"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
                  >
                    {isSubmitting || isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Log In'
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;