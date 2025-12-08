import React from 'react';
import { useLocation } from 'react-router-dom';

const RouteDebugger = () => {
  const location = useLocation();
  
  console.log('Current route:', location.pathname);
  console.log('Route state:', location.state);
  
  return null;
};

export default RouteDebugger;