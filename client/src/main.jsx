import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { wakeUpBackend } from './utils/wakeUpBackend';

// ==================== CRITICAL FIX ====================
// Make React globally available to prevent "createContext of undefined"
window.React = React;
console.log('🔧 React initialized globally:', React.version);
// =====================================================

// Add Google Fonts for the display font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Safe environment validation
const isDevelopment = import.meta.env.DEV;
const apiUrl = import.meta.env.VITE_API_URL;

console.log(`🚀 App starting in ${isDevelopment ? 'development' : 'production'} mode`);

// Safe API URL validation with fallbacks
const getValidApiUrl = () => {
  // Check if VITE_API_URL is properly set
  if (typeof apiUrl === 'string' && apiUrl.trim() && !apiUrl.includes('VITE_API_URL=')) {
    console.log('✅ API URL from env:', apiUrl);
    return apiUrl;
  }
  
  console.warn('⚠️ VITE_API_URL not properly configured');
  
  // Production fallback
  if (!isDevelopment) {
    const fallbackUrl = 'https://api.holidayvibestour.com';
    console.log('📦 Using production fallback:', fallbackUrl);
    return fallbackUrl;
  }
  
  // Development fallback
  const devFallback = 'http://localhost:3001';
  console.log('💻 Using development fallback:', devFallback);
  return devFallback;
};

const validApiUrl = getValidApiUrl();

// Store API URL globally for other modules
window.API_URL = validApiUrl;

// Non-blocking backend wakeup (only in production)
if (!isDevelopment) {
  // Run after a short delay to not block app startup
  setTimeout(() => {
    console.log('🌅 Attempting to wake up backend server...');
    
    wakeUpBackend(validApiUrl) // Pass the validated URL
      .then(result => {
        if (result.success) {
          console.log('✅ Backend server ready');
        } else {
          console.warn('⚠️ Backend might be slow:', result.message);
        }
      })
      .catch(error => {
        // Non-critical error - don't break the app
        console.log('📡 Backend check failed, app will work offline:', error.message);
      });
  }, 2000); // Wait 2 seconds after app loads
}

// Safe React render with error boundary
try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Could not find #root element in the DOM');
  }
  
  console.log('🎬 Mounting React app to #root element');
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ React app successfully mounted');
  
} catch (error) {
  console.error('❌ Failed to mount React app:', error);
  
  // Graceful degradation: Show user-friendly error
  const fallbackElement = document.getElementById('root') || document.body;
  fallbackElement.innerHTML = `
    <div style="
      padding: 40px;
      text-align: center;
      font-family: 'Montserrat', sans-serif;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin: 20px;
      color: #991b1b;
    ">
      <h2 style="margin-bottom: 16px;">⚠️ Application Error</h2>
      <p style="margin-bottom: 24px;">There was a problem loading the application.</p>
      <p style="margin-bottom: 16px; font-size: 14px; color: #7f1d1d;">
        Error: ${error.message}
      </p>
      <button onclick="window.location.reload()" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      ">
        Refresh Page
      </button>
    </div>
  `;
}