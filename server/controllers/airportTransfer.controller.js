const AirportTransfer = require('../models/AirportTransfer');

// @desc    Get active airport transfers (public)
// @route   GET /api/v1/airport-transfers/active
// @access  Public
exports.getActiveTransfers = async (req, res, next) => {
  try {
    console.log('Fetching active airport transfers...');
    
    // Find active transfers
    const transfers = await AirportTransfer.find({ isActive: true }).sort({ airportName: 1 });
    
    console.log(`Found ${transfers.length} active transfers`);
    
    // Format response
    const formattedTransfers = transfers.map(transfer => ({
      _id: transfer._id,
      airportName: transfer.airportName,
      hotelName: transfer.hotelName, // CHANGED: airportCode to hotelName
      oneWayPriceMUR: transfer.oneWayPriceMUR,
      oneWayPriceEUR: transfer.oneWayPriceEUR,
      roundTripPriceMUR: transfer.roundTripPriceMUR,
      roundTripPriceEUR: transfer.roundTripPriceEUR,
      description: transfer.description,
      estimatedTime: transfer.estimatedTime,
      capacity: transfer.capacity,
      vehicleType: transfer.vehicleType,
      isActive: transfer.isActive,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
      // For backward compatibility
      oneWayPrice: transfer.oneWayPriceMUR,
      roundTripPrice: transfer.roundTripPriceMUR
    }));
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: formattedTransfers
    });
  } catch (error) {
    console.error('❌ Error fetching active transfers:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Send more detailed error for debugging
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transfers',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all airport transfers (admin only)
// @route   GET /api/v1/airport-transfers
// @access  Private/Admin
exports.getTransfers = async (req, res, next) => {
  try {
    console.log('Fetching all airport transfers (admin)...');
    
    const transfers = await AirportTransfer.find().sort({ createdAt: -1 });
    
    console.log(`Found ${transfers.length} transfers total`);
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    console.error('❌ Error fetching all transfers:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Get single airport transfer
// @route   GET /api/v1/airport-transfers/:id
// @access  Public
exports.getTransfer = async (req, res, next) => {
  try {
    const transfer = await AirportTransfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Airport transfer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('❌ Error fetching transfer:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create airport transfer
// @route   POST /api/v1/airport-transfers
// @access  Private/Admin
exports.createTransfer = async (req, res, next) => {
  try {
    console.log('Creating transfer with data:', req.body);
    
    // Create transfer
    const transfer = await AirportTransfer.create(req.body);
    
    console.log('Transfer created successfully:', transfer._id);
    
    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('❌ Error creating transfer:', error.message);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update airport transfer
// @route   PUT /api/v1/airport-transfers/:id
// @access  Private/Admin
exports.updateTransfer = async (req, res, next) => {
  try {
    let transfer = await AirportTransfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Airport transfer not found'
      });
    }
    
    transfer = await AirportTransfer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('❌ Error updating transfer:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete airport transfer
// @route   DELETE /api/v1/airport-transfers/:id
// @access  Private/Admin
exports.deleteTransfer = async (req, res, next) => {
  try {
    const transfer = await AirportTransfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Airport transfer not found'
      });
    }
    
    await transfer.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('❌ Error deleting transfer:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};