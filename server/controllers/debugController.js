const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Check Cloudinary connection
// @route   GET /api/v1/debug/cloudinary
// @access  Private
exports.checkCloudinaryConnection = async (req, res) => {
  try {
    // Print out the Cloudinary configuration
    console.log('Cloudinary Configuration:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Exists (hidden)' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Exists (hidden)' : 'Missing'
    });

    // Test Cloudinary connection by getting account info
    const result = await cloudinary.api.ping();
    
    res.status(200).json({
      success: true,
      message: 'Cloudinary connection successful',
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        connectionStatus: result.status === 'pong' ? 'connected' : 'error'
      }
    });
  } catch (error) {
    console.error('Cloudinary connection test error:', error);
    res.status(500).json({
      success: false,
      error: `Cloudinary connection failed: ${error.message}`,
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'missing',
        apiKeyExists: !!process.env.CLOUDINARY_API_KEY,
        apiSecretExists: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  }
};

// @desc    Test Cloudinary configuration
// @route   GET /api/v1/debug/cloudinary
exports.testCloudinary = async (req, res) => {
  try {
    // Print Cloudinary config (excluding secrets)
    console.log('Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    });

    // Test connection by getting account info
    const result = await cloudinary.api.ping();
    
    res.status(200).json({
      success: true,
      message: 'Cloudinary connection successful',
      data: result
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    res.status(500).json({
      success: false,
      error: `Cloudinary connection test failed: ${error.message}`,
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'missing',
        apiKeyExists: Boolean(process.env.CLOUDINARY_API_KEY),
        apiSecretExists: Boolean(process.env.CLOUDINARY_API_SECRET)
      }
    });
  }
};

// @desc    Check database connection and data
// @route   GET /api/v1/debug/database
// @access  Public (for debugging)
exports.checkDatabase = async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const dbInfo = {
      connectionState: connectionStates[connectionState] || 'unknown',
      readyState: connectionState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      database: mongoose.connection.db?.databaseName || 'unknown'
    };
    
    // Count documents in collections
    const counts = {
      activities: await Activity.countDocuments(),
      bookings: await Booking.countDocuments(),
      users: await User.countDocuments()
    };
    
    // Get recent documents
    const recent = {
      activities: await Activity.find().sort({ createdAt: -1 }).limit(5).select('title createdAt _id'),
      bookings: await Booking.find().sort({ createdAt: -1 }).limit(5).select('bookingReference fullName createdAt _id'),
      users: await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt _id')
    };
    
    res.status(200).json({
      success: true,
      message: 'Database diagnostic information',
      database: dbInfo,
      counts,
      recent
    });
  } catch (error) {
    console.error('Database diagnostic error:', error);
    res.status(500).json({
      success: false,
      error: `Database diagnostic failed: ${error.message}`,
      connectionState: mongoose.connection.readyState
    });
  }
};
