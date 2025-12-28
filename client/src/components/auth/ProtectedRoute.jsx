import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if redirected due to session expiry
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('session') === 'expired') {
      // Clear the query parameter
      const newPath = location.pathname;
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }
  
  return children;
};

export default ProtectedRoute;