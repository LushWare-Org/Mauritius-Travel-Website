const AirportTransfer = require('../models/AirportTransfer');

// @desc    Get all airport transfers (admin only)
// @route   GET /api/v1/airport-transfers
// @access  Private/Admin
exports.getTransfers = async (req, res, next) => {
  try {
    const transfers = await AirportTransfer.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active airport transfers (public)
// @route   GET /api/v1/airport-transfers/active
// @access  Public
exports.getActiveTransfers = async (req, res, next) => {
  try {
    const transfers = await AirportTransfer.find({ isActive: true }).sort({ airportName: 1 });
    
    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    next(error);
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
    next(error);
  }
};

// @desc    Create airport transfer
// @route   POST /api/v1/airport-transfers
// @access  Private/Admin
exports.createTransfer = async (req, res, next) => {
  try {
    const transfer = await AirportTransfer.create(req.body);
    
    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
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
    
    transfer = await AirportTransfer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
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
    next(error);
  }
};