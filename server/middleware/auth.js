const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
// Protect routes - Check both JWT and Session
exports.protect = async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Check session first (for auto-logout)
  if (req.session && req.session.user) {
    // Check if session expired
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    
    if (now - lastActivity > 60 * 60 * 1000) {
      // Session expired
      req.session.destroy();
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED'
      });
    }
    
    // Update session activity
    req.session.lastActivity = now;
    
    // Get user from database
    try {
      req.user = await User.findById(req.session.user.id);
      if (!req.user) {
        // User deleted, destroy session
        req.session.destroy();
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      return next();
    } catch (error) {
      console.error('Error fetching user from session:', error);
    }
  }
  
  // If no valid session, fall back to JWT token
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Also create/update session for future auto-logout
    if (req.session) {
      req.session.user = {
        id: req.user._id.toString(),
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
      req.session.lastActivity = Date.now();
      req.session.jwtToken = token;
    }
    
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
