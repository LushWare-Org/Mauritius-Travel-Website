import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LogoutWarning = () => {
  const { currentUser, logout, showLogoutWarning, setShowLogoutWarning } = useAuth();
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [isVisible, setIsVisible] = useState(false);

  // Show warning when showLogoutWarning is true and user is logged in
  useEffect(() => {
    if (showLogoutWarning && currentUser) {
      setIsVisible(true);
      setCountdown(300); // Reset to 5 minutes
    } else {
      setIsVisible(false);
    }
  }, [showLogoutWarning, currentUser]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (isVisible && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isVisible && countdown <= 0) {
      handleAutoLogout();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, countdown]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleStayLoggedIn = async () => {
    try {
      console.log('🔄 User chose to stay logged in, resetting timers');
      
      // Reset warning flag
      setShowLogoutWarning(false);
      setIsVisible(false);
      
      // Make an API call to refresh session
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Session refreshed successfully');
        
        // Trigger user activity to reset all timers
        window.dispatchEvent(new Event('click'));
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
      // Still close the warning and let activity events handle it
      setShowLogoutWarning(false);
      setIsVisible(false);
    }
  };

  const handleLogoutNow = async () => {
    console.log('👋 User chose to logout immediately');
    await logout();
  };

  const handleAutoLogout = async () => {
    console.log('🕐 Auto-logout triggered from warning modal');
    await logout();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-yellow-600" 
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
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Session Timeout Warning
            </h3>
            <p className="text-gray-600 text-sm">
              Your session will expire in{' '}
              <span className="font-bold text-red-600">{formatCountdown(countdown)}</span>{' '}
              due to inactivity.
            </p>
          </div>
        </div>
        
        <div className="mb-5">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 300) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Time remaining: {formatCountdown(countdown)}
          </p>
        </div>
        
        <p className="text-gray-700 mb-5">
          Do you want to stay logged in? Click "Stay Logged In" to continue your session,
          or you will be automatically logged out when the timer reaches zero.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleLogoutNow}
            className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Logout Now
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            autoFocus
          >
            Stay Logged In
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Your session will automatically renew with any mouse or keyboard activity.</p>
        </div>
      </div>
    </div>
  );
};

export default LogoutWarning;