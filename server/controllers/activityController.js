const Activity = require('../models/Activity');

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

    // Get currency from query parameter or use default (EUR)
    const displayCurrency = req.query.currency || 'EUR';

    // Format activities with selected currency
    const activitiesWithCurrency = activities.map(activity => {
      const activityObj = activity.toObject();
      
      // Add currency information
      activityObj.displayCurrency = displayCurrency;
      activityObj.symbol = getCurrencySymbol(displayCurrency);
      
      // Set prices based on selected currency
      if (displayCurrency === 'MUR') {
        // Use MUR (Rs) prices
        activityObj.price = activity.halfDayPriceMUR || 0; // Use halfDayPrice as default
        activityObj.fullDayPrice = activity.fullDayPriceMUR || 0;
        activityObj.halfDayPrice = activity.halfDayPriceMUR || 0;
      } else {
        // Default to EUR prices
        activityObj.price = activity.halfDayPriceEUR || 0; // Use halfDayPrice as default
        activityObj.fullDayPrice = activity.fullDayPriceEUR || 0;
        activityObj.halfDayPrice = activity.halfDayPriceEUR || 0;
      }
      
      // Set pricingType based on available prices
      activityObj.pricingType = 'half-full-day'; // All activities now have half/full day pricing
      
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
    'EUR': '€',
    'MUR': 'Rs'
  };
  return symbols[currency] || '€'; // Default to Euro symbol
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

    // Get currency from query parameter or use default (EUR)
    const displayCurrency = req.query.currency || 'EUR';

    // Ensure price is set properly based on pricingType and currency
    const activityObj = activity.toObject();
    
    // Add currency information
    activityObj.displayCurrency = displayCurrency;
    activityObj.symbol = getCurrencySymbol(displayCurrency);
    
    // Set pricingType
    activityObj.pricingType = 'half-full-day';
    
    // Set prices based on selected currency
    if (displayCurrency === 'MUR') {
      // Use MUR (Rs) prices
      activityObj.price = activity.halfDayPriceMUR || 0;
      activityObj.fullDayPrice = activity.fullDayPriceMUR;
      activityObj.halfDayPrice = activity.halfDayPriceMUR;
    } else {
      // Default to EUR prices
      activityObj.price = activity.halfDayPriceEUR || 0;
      activityObj.fullDayPrice = activity.fullDayPriceEUR;
      activityObj.halfDayPrice = activity.halfDayPriceEUR;
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
    
    // Validate all currency prices are provided (only half/full day prices now)
    const requiredPrices = [
      'fullDayPriceEUR', 'halfDayPriceEUR',
      'fullDayPriceMUR', 'halfDayPriceMUR'
    ];
    
    for (const priceField of requiredPrices) {
      if (!activityData[priceField] && activityData[priceField] !== 0) {
        return res.status(400).json({
          success: false,
          error: `${priceField} is required for all currencies`
        });
      }
    }
    
    // Set default price fields for backward compatibility
    activityData.price = activityData.halfDayPriceEUR; // Use half day EUR price as default
    activityData.priceEUR = activityData.halfDayPriceEUR; // For backward compatibility
    activityData.priceMUR = activityData.halfDayPriceMUR; // For backward compatibility
    
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
    
    // Validate currency prices if provided
    const currencyPrices = [
      'fullDayPriceEUR', 'halfDayPriceEUR',
      'fullDayPriceMUR', 'halfDayPriceMUR'
    ];
    
    for (const priceField of currencyPrices) {
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