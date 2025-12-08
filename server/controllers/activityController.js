const Activity = require('../models/Activity');

// @desc    Get all activities
// @route   GET /api/v1/activities
// @access  Public
exports.getActivities = async (req, res, next) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
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

    // Ensure price is set properly based on pricingType
    const activitiesWithPrice = activities.map(activity => {
      const activityObj = activity.toObject();
      
      // For backward compatibility and proper price display
      if (activityObj.pricingType === 'half-full-day') {
        // If it's half-full-day pricing, ensure price is set from halfDayPrice
        if (!activityObj.price && activityObj.halfDayPrice) {
          activityObj.price = activityObj.halfDayPrice;
        }
      } else {
        // For other pricing types, use fullDayPrice if price is not set
        if (!activityObj.price && activityObj.fullDayPrice) {
          activityObj.price = activityObj.fullDayPrice;
        }
      }
      
      return activityObj;
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      pagination,
      data: activitiesWithPrice,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

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

    // Ensure price is set properly based on pricingType
    const activityObj = activity.toObject();
    
    if (activityObj.pricingType === 'half-full-day') {
      // If it's half-full-day pricing, ensure price is set from halfDayPrice
      if (!activityObj.price && activityObj.halfDayPrice) {
        activityObj.price = activityObj.halfDayPrice;
      }
    } else {
      // For other pricing types, use fullDayPrice if price is not set
      if (!activityObj.price && activityObj.fullDayPrice) {
        activityObj.price = activityObj.fullDayPrice;
      }
    }

    res.status(200).json({
      success: true,
      data: activityObj,
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
    
    // Handle pricing based on pricingType
    if (activityData.pricingType === 'half-full-day') {
      // For half-full-day pricing, set price from halfDayPrice
      if (activityData.halfDayPrice && !activityData.price) {
        activityData.price = activityData.halfDayPrice;
      }
      
      // Ensure both halfDayPrice and fullDayPrice are provided
      if (!activityData.halfDayPrice || !activityData.fullDayPrice) {
        return res.status(400).json({
          success: false,
          error: 'Both halfDayPrice and fullDayPrice are required for half-full-day pricing'
        });
      }
    } else if (activityData.pricingType === 'full-day') {
      // For full-day pricing, set price from fullDayPrice
      if (activityData.fullDayPrice && !activityData.price) {
        activityData.price = activityData.fullDayPrice;
      }
      
      // Ensure fullDayPrice is provided
      if (!activityData.fullDayPrice) {
        return res.status(400).json({
          success: false,
          error: 'fullDayPrice is required for full-day pricing'
        });
      }
    } else {
      // For other pricing types (like 'fixed'), ensure price is provided
      if (!activityData.price && activityData.fullDayPrice) {
        activityData.price = activityData.fullDayPrice;
      }
    }

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
    
    // Handle pricing based on pricingType
    if (activityData.pricingType === 'half-full-day') {
      // For half-full-day pricing, set price from halfDayPrice
      if (activityData.halfDayPrice && !activityData.price) {
        activityData.price = activityData.halfDayPrice;
      }
      
      // If updating to half-full-day, ensure both prices are provided
      if (activityData.pricingType === 'half-full-day' && 
          (!activityData.halfDayPrice || !activityData.fullDayPrice)) {
        return res.status(400).json({
          success: false,
          error: 'Both halfDayPrice and fullDayPrice are required for half-full-day pricing'
        });
      }
    } else if (activityData.pricingType === 'full-day') {
      // For full-day pricing, set price from fullDayPrice
      if (activityData.fullDayPrice && !activityData.price) {
        activityData.price = activityData.fullDayPrice;
      }
      
      // If updating to full-day, ensure fullDayPrice is provided
      if (activityData.pricingType === 'full-day' && !activityData.fullDayPrice) {
        return res.status(400).json({
          success: false,
          error: 'fullDayPrice is required for full-day pricing'
        });
      }
    } else {
      // For other pricing types, ensure price is provided
      if (!activityData.price && activityData.fullDayPrice) {
        activityData.price = activityData.fullDayPrice;
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