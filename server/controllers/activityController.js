const Activity = require('../models/Activity');

// In your activityController.js - update the getActivities function

// @desc    Get all activities
// @route   GET /api/v1/activities
// @access  Public
exports.getActivities = async (req, res, next) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'currency'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Filter by status (only show active by default)
    if (!queryObj.status) {
      queryObj.status = 'active';
    }

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Activity.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Activity.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const activities = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    // Get currency from query parameter or use default
    const displayCurrency = req.query.currency || 'USD';

    // Helper function to get currency symbol
    const getCurrencySymbol = (currency) => {
      const symbols = {
        'USD': '$',
        'EUR': '€',
        'MUR': 'Rs'
      };
      return symbols[currency] || '$';
    };

    // Format activities with selected currency
    const activitiesWithCurrency = activities.map(activity => {
      const activityObj = activity.toObject();
      
      // Add currency information
      activityObj.displayCurrency = displayCurrency;
      activityObj.symbol = getCurrencySymbol(displayCurrency);
      
      // Check if activity has half/full day pricing
      const hasHalfFullDay = activity.pricingType === 'half-full-day';
      
      // Set prices based on selected currency
      if (displayCurrency === 'EUR') {
        // Use EUR prices with fallback to USD
        activityObj.price = activity.priceEUR || activity.price || 0;
        activityObj.fullDayPrice = activity.fullDayPriceEUR || activity.fullDayPrice || activity.price || 0;
        activityObj.halfDayPrice = activity.halfDayPriceEUR || activity.halfDayPrice || activity.price || 0;
      } else if (displayCurrency === 'MUR') {
        // Use MUR (Rs) prices with fallback to USD
        activityObj.price = activity.priceMUR || activity.price || 0;
        activityObj.fullDayPrice = activity.fullDayPriceMUR || activity.fullDayPrice || activity.price || 0;
        activityObj.halfDayPrice = activity.halfDayPriceMUR || activity.halfDayPrice || activity.price || 0;
      } else {
        // Use USD prices
        activityObj.price = activity.price || 0;
        activityObj.fullDayPrice = activity.fullDayPrice || activity.price || 0;
        activityObj.halfDayPrice = activity.halfDayPrice || activity.price || 0;
      }
      
      // For backward compatibility - ensure price is set properly
      if (hasHalfFullDay) {
        activityObj.price = activityObj.halfDayPrice;
      }
      
      return activityObj;
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      pagination,
      data: activitiesWithCurrency,
      currency: displayCurrency
    });
  } catch (err) {
    console.error('Error in getActivities:', err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// Helper function to get currency symbol
function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'MUR': 'Rs'
  };
  return symbols[currency] || '$';
}

// @desc    Get single activity
// @route   GET /api/v1/activities/:id
// @access  Public
exports.getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    // Get currency from query parameter or use default
    const displayCurrency = req.query.currency || 'USD';

    // Ensure price is set properly based on pricingType and currency
    const activityObj = activity.toObject();
    
    // Add currency information
    activityObj.displayCurrency = displayCurrency;
    activityObj.symbol = getCurrencySymbol(displayCurrency);
    
    // Set prices based on selected currency
    if (displayCurrency === 'EUR') {
      // Use EUR prices
      if (activityObj.pricingType === 'half-full-day') {
        activityObj.price = activityObj.halfDayPriceEUR || activityObj.priceEUR;
        activityObj.fullDayPrice = activityObj.fullDayPriceEUR;
        activityObj.halfDayPrice = activityObj.halfDayPriceEUR;
      } else {
        activityObj.price = activityObj.priceEUR;
        activityObj.fullDayPrice = activityObj.fullDayPriceEUR;
        activityObj.halfDayPrice = activityObj.halfDayPriceEUR;
      }
    } else if (displayCurrency === 'MUR') {
      // Use MUR (Rs) prices
      if (activityObj.pricingType === 'half-full-day') {
        activityObj.price = activityObj.halfDayPriceMUR || activityObj.priceMUR;
        activityObj.fullDayPrice = activityObj.fullDayPriceMUR;
        activityObj.halfDayPrice = activityObj.halfDayPriceMUR;
      } else {
        activityObj.price = activityObj.priceMUR;
        activityObj.fullDayPrice = activityObj.fullDayPriceMUR;
        activityObj.halfDayPrice = activityObj.halfDayPriceMUR;
      }
    } else {
      // Use USD prices (default)
      if (activityObj.pricingType === 'half-full-day') {
        activityObj.price = activityObj.halfDayPrice || activityObj.price;
        activityObj.fullDayPrice = activityObj.fullDayPrice;
        activityObj.halfDayPrice = activityObj.halfDayPrice;
      } else {
        activityObj.price = activityObj.price;
        activityObj.fullDayPrice = activityObj.fullDayPrice;
        activityObj.halfDayPrice = activityObj.halfDayPrice;
      }
    }

    res.status(200).json({
      success: true,
      data: activityObj,
      currency: displayCurrency
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Create activity
// @route   POST /api/v1/activities
// @access  Private/Admin
exports.createActivity = async (req, res, next) => {
  try {
    const activityData = { ...req.body };
    
    // Validate all currency prices are provided
    const requiredPrices = [
      'price', 'fullDayPrice', 'halfDayPrice',
      'priceEUR', 'fullDayPriceEUR', 'halfDayPriceEUR',
      'priceMUR', 'fullDayPriceMUR', 'halfDayPriceMUR'
    ];
    
    for (const priceField of requiredPrices) {
      if (!activityData[priceField] && activityData[priceField] !== 0) {
        return res.status(400).json({
          success: false,
          error: `${priceField} is required for all currencies`
        });
      }
    }
    
    // Set default currency values
    activityData.currency = activityData.currency || 'USD';
    activityData.displayCurrency = activityData.displayCurrency || 'USD';
    
    const activity = await Activity.create(activityData);

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Update activity
// @route   PUT /api/v1/activities/:id
// @access  Private/Admin
exports.updateActivity = async (req, res, next) => {
  try {
    const activityData = { ...req.body };
    
    // Validate all currency prices if provided
    const requiredPrices = [
      'price', 'fullDayPrice', 'halfDayPrice',
      'priceEUR', 'fullDayPriceEUR', 'halfDayPriceEUR',
      'priceMUR', 'fullDayPriceMUR', 'halfDayPriceMUR'
    ];
    
    for (const priceField of requiredPrices) {
      if (activityData[priceField] !== undefined && activityData[priceField] < 0) {
        return res.status(400).json({
          success: false,
          error: `${priceField} cannot be negative`
        });
      }
    }

    const activity = await Activity.findByIdAndUpdate(req.params.id, activityData, {
      new: true,
      runValidators: true,
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Delete activity
// @route   DELETE /api/v1/activities/:id
// @access  Private/Admin
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found',
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};