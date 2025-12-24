const AirportTransferBooking = require('../models/AirportTransferBooking');
const AirportTransfer = require('../models/AirportTransfer');
const User = require('../models/User');

// Helper function - add this since the import might fail
const calculateTransferPrice = (transfer, tripType, currency = 'MUR') => {
  if (!transfer) return 0;
  
  let price = 0;
  
  if (currency === 'MUR') {
    price = tripType === 'one-way' 
      ? transfer.oneWayPriceMUR 
      : transfer.roundTripPriceMUR;
  } else {
    price = tripType === 'one-way'
      ? transfer.oneWayPriceEUR
      : transfer.roundTripPriceEUR;
  }
  
  return parseFloat(price) || 0;
};

// @desc    Create airport transfer booking
// @route   POST /api/v1/airport-transfer-bookings
// @access  Public
exports.createBooking = async (req, res) => {
  try {
    console.log('📥 Received booking request:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = [
      'transfer',
      'guestName',
      'email',
      'phone',
      'arrivalDate',
      'arrivalTime',
      'tripType',
      'transferType',
      'passengers',
      'currency'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    console.log('✅ All required fields present');
    
    // Get transfer details
    const transfer = await AirportTransfer.findById(req.body.transfer);
    if (!transfer) {
      console.log('❌ Transfer not found:', req.body.transfer);
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }
    
    console.log('✅ Transfer found:', transfer.airportName);
    
    // Calculate price based on currency
    let basePrice = 0;
    
    if (req.body.currency === 'MUR') {
      basePrice = req.body.tripType === 'one-way' 
        ? transfer.oneWayPriceMUR 
        : transfer.roundTripPriceMUR;
    } else {
      basePrice = req.body.tripType === 'one-way'
        ? transfer.oneWayPriceEUR
        : transfer.roundTripPriceEUR;
    }
    
    basePrice = parseFloat(basePrice) || 0;
    console.log('💰 Base price calculated:', { basePrice, currency: req.body.currency, tripType: req.body.tripType });
    
    if (basePrice <= 0) {
      console.log('❌ Invalid base price:', basePrice);
      return res.status(400).json({
        success: false,
        error: 'Invalid transfer pricing'
      });
    }
    
    const passengers = parseInt(req.body.passengers) || 1;
    const totalPrice = basePrice * passengers;
    
    console.log('💰 Total price calculated:', { totalPrice, passengers, basePrice });
    
    // Calculate alternative currency price for reference
    const altCurrency = req.body.currency === 'MUR' ? 'EUR' : 'MUR';
    let altBasePrice = 0;
    
    if (altCurrency === 'MUR') {
      altBasePrice = req.body.tripType === 'one-way' 
        ? transfer.oneWayPriceMUR 
        : transfer.roundTripPriceMUR;
    } else {
      altBasePrice = req.body.tripType === 'one-way'
        ? transfer.oneWayPriceEUR
        : transfer.roundTripPriceEUR;
    }
    
    altBasePrice = parseFloat(altBasePrice) || 0;
    const altTotalPrice = altBasePrice * passengers;
    
    // Generate booking reference
    const bookingReference = 'ATB-' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    console.log('📝 Creating booking with data:', {
      totalPrice,
      currency: req.body.currency,
      bookingReference
    });
    
    // Create booking with currency data
    const booking = await AirportTransferBooking.create({
      transfer: req.body.transfer,
      guestName: req.body.guestName.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone.trim(),
      flightNumber: req.body.flightNumber?.trim() || '',
      arrivalDate: new Date(req.body.arrivalDate),
      arrivalTime: req.body.arrivalTime,
      departureDate: req.body.departureDate ? new Date(req.body.departureDate) : null,
      departureTime: req.body.departureTime || '',
      tripType: req.body.tripType,
      transferType: req.body.transferType,
      passengers: passengers,
      specialRequests: req.body.specialRequests?.trim() || '',
      currency: req.body.currency,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      user: req.body.user || null,
      status: 'pending',
      bookingReference: bookingReference,
      prices: {
        [req.body.currency]: {
          totalPrice: parseFloat(totalPrice.toFixed(2))
        },
        [altCurrency]: {
          totalPrice: parseFloat(altTotalPrice.toFixed(2))
        }
      }
    });
    
    console.log('✅ Booking created successfully:', booking._id);
    
    // Populate the transfer details
    const populatedBooking = await AirportTransferBooking.findById(booking._id)
      .populate(
        'transfer',
        'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
      );
    
    res.status(201).json({
      success: true,
      data: populatedBooking
    });
    
  } catch (error) {
    console.error('❌ Booking creation error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.log('❌ Validation errors:', messages);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Booking reference already exists. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all airport transfer bookings
// @route   GET /api/v1/airport-transfer-bookings
// @access  Private/Admin
exports.getBookings = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach((param) => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = AirportTransferBooking.find(JSON.parse(queryStr))
      .populate(
        'transfer',
        'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
      )
      .populate('user', 'name email');

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await AirportTransferBooking.countDocuments(
      JSON.parse(queryStr)
    );

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const bookings = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single airport transfer booking
// @route   GET /api/v1/airport-transfer-bookings/:id
// @access  Private/Admin
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await AirportTransferBooking.findById(req.params.id)
      .populate(
        'transfer',
        'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
      )
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (admin only)
// @route   PUT /api/v1/airport-transfer-bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const booking = await AirportTransferBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Update status
    booking.status = status;

    // Add confirmation date if confirming
    if (status === 'confirmed' && !booking.confirmationDate) {
      booking.confirmationDate = Date.now();
    }

    // Add admin notes if provided
    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }

    await booking.save();

    // Populate transfer details
    const populatedBooking = await AirportTransferBooking.findById(booking._id)
      .populate(
        'transfer',
        'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
      )
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking
// @route   PUT /api/v1/airport-transfer-bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await AirportTransferBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Check if currency or transfer is changing
    const currencyChanged = req.body.currency && req.body.currency !== booking.currency;
    const transferChanged = req.body.transfer && req.body.transfer !== booking.transfer.toString();
    const tripTypeChanged = req.body.tripType && req.body.tripType !== booking.tripType;
    const passengersChanged = req.body.passengers && parseInt(req.body.passengers) !== booking.passengers;

    // If transfer, trip type, passengers, or currency is changing, recalculate price
    if (transferChanged || tripTypeChanged || passengersChanged || currencyChanged) {
      const transferId = req.body.transfer || booking.transfer;
      const transfer = await AirportTransfer.findById(transferId);

      if (!transfer || !transfer.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Transfer not found or not available',
        });
      }

      const tripType = req.body.tripType || booking.tripType;
      const passengers = parseInt(req.body.passengers) || booking.passengers;
      const currency = req.body.currency || booking.currency;

      // Calculate new price
      const basePrice = calculateTransferPrice(transfer, tripType, currency);
      const totalPrice = basePrice * passengers;

      // Calculate alternative currency price
      const altCurrency = currency === 'MUR' ? 'EUR' : 'MUR';
      const altBasePrice = calculateTransferPrice(transfer, tripType, altCurrency);
      const altTotalPrice = altBasePrice * passengers;

      req.body.totalPrice = parseFloat(totalPrice.toFixed(2));
      
      // Update prices object
      if (!req.body.prices) req.body.prices = {};
      req.body.prices = {
        [currency]: { totalPrice: parseFloat(totalPrice.toFixed(2)) },
        [altCurrency]: { totalPrice: parseFloat(altTotalPrice.toFixed(2)) }
      };
    }

    booking = await AirportTransferBooking.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        'transfer',
        'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
      )
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete booking
// @route   DELETE /api/v1/airport-transfer-bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await AirportTransferBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's airport transfer bookings
// @route   GET /api/v1/airport-transfer-bookings/user/my-bookings
// @access  Private
exports.getUserBookings = async (req, res, next) => {
  try {
    // Get bookings where user matches OR email matches (for guest bookings linked by email)
    const bookings = await AirportTransferBooking.find({
      $or: [
        { user: req.user.id },
        { email: req.user.email, isGuestBooking: true },
      ],
    })
      .populate(
        'transfer',
        'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
      )
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get guest booking by reference and email
// @route   GET /api/v1/airport-transfer-bookings/guest/:reference
// @access  Public
exports.getGuestBooking = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required to access guest booking',
      });
    }

    const booking = await AirportTransferBooking.findOne({
      bookingReference: reference,
      email: email.toLowerCase(),
      isGuestBooking: true,
    }).populate(
      'transfer',
      'airportName airportCode oneWayPriceMUR oneWayPriceEUR roundTripPriceMUR roundTripPriceEUR vehicleType'
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or email does not match',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking statistics
// @route   GET /api/v1/airport-transfer-bookings/stats
// @access  Private/Admin
exports.getBookingStats = async (req, res, next) => {
  try {
    const stats = await AirportTransferBooking.aggregate([
      {
        $facet: {
          totalBookings: [{ $count: 'count' }],
          guestBookings: [
            { $match: { isGuestBooking: true } },
            { $count: 'count' },
          ],
          userBookings: [
            { $match: { isGuestBooking: false } },
            { $count: 'count' },
          ],
          byCurrency: [
            { $group: { 
              _id: '$currency', 
              count: { $sum: 1 },
              totalRevenue: { $sum: '$totalPrice' }
            }},
            { $sort: { _id: 1 } }
          ],
          totalRevenue: [
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
          ],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byMonth: [
            {
              $group: {
                _id: { $month: '$createdAt' },
                count: { $sum: 1 },
                revenue: { $sum: '$totalPrice' },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recentBookings: [{ $sort: { createdAt: -1 } }, { $limit: 10 }],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    next(error);
  }
};