const AirportTransferBooking = require('../models/AirportTransferBooking');
const AirportTransfer = require('../models/AirportTransfer');
const User = require('../models/User');

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
        'airportName airportCode oneWayPrice roundTripPrice vehicleType'
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
// @access  Private (for user bookings) / Public (for guest bookings with reference)
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await AirportTransferBooking.findById(req.params.id)
      .populate(
        'transfer',
        'airportName airportCode oneWayPrice roundTripPrice vehicleType'
      )
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Check authorization
    // If user is authenticated and owns the booking
    if (req.user) {
      if (
        booking.user &&
        booking.user._id.toString() !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access this booking',
        });
      }
    }
    // If no user is authenticated, only allow access if booking has no user (guest booking)
    // In practice, you might want to implement a different auth method for guest bookings
    // like checking booking reference via query parameter

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create airport transfer booking
// @route   POST /api/v1/airport-transfer-bookings
// @access  Public (both authenticated and guest users)
exports.createBooking = async (req, res, next) => {
  try {
    // Check if transfer exists and is active
    const transfer = await AirportTransfer.findById(req.body.transfer);

    if (!transfer || !transfer.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found or not available',
      });
    }

    // Calculate total price - FLAT RATE, NO MULTIPLICATION BY PASSENGERS
    let totalPrice = 0;
    if (req.body.tripType === 'one-way') {
      totalPrice = transfer.oneWayPrice; // Flat rate - no multiplication
    } else {
      totalPrice = transfer.roundTripPrice; // Flat rate - no multiplication
    }

    // Prepare booking data
    const bookingData = {
      ...req.body,
      totalPrice: totalPrice,
      arrivalDate: new Date(req.body.arrivalDate),
      departureDate: req.body.departureDate
        ? new Date(req.body.departureDate)
        : null,
      // Store passengers but don't use for pricing
      passengers: req.body.passengers || 1,
    };

    // Add user to booking if authenticated
    if (req.user) {
      bookingData.user = req.user.id;
    }
    // If not authenticated, user will remain null (guest booking)
    // The model has default: null for user field

    // Validate required fields
    if (!bookingData.guestName || !bookingData.email || !bookingData.phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide guest name, email, and phone number',
      });
    }

    const booking = await AirportTransferBooking.create(bookingData);

    // Populate transfer details
    const populatedBooking = await AirportTransferBooking.findById(booking._id)
      .populate(
        'transfer',
        'airportName airportCode oneWayPrice roundTripPrice vehicleType'
      )
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    console.error('Error creating booking:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate booking reference. Please try again.',
      });
    }

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
        'airportName airportCode oneWayPrice roundTripPrice vehicleType'
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

// @desc    Update booking (user can update their own booking if pending)
// @route   PUT /api/v1/airport-transfer-bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await AirportTransferBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Check if user is authorized
    // For guest bookings (no user), we need different authorization logic
    if (booking.user) {
      // Booking has a user, check if current user owns it or is admin
      if (
        booking.user.toString() !== req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to update this booking',
        });
      }
    } else {
      // Guest booking - you might want to implement email/booking reference verification
      // For now, only admin can update guest bookings
      if (req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to update this guest booking',
        });
      }
    }

    // Users can only update pending bookings
    if (booking.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update booking after it has been processed',
      });
    }

    // If transfer is changed, recalculate price
    if (
      req.body.transfer &&
      req.body.transfer !== booking.transfer.toString()
    ) {
      const transfer = await AirportTransfer.findById(req.body.transfer);

      if (!transfer || !transfer.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Transfer not found or not available',
        });
      }

      let totalPrice = 0;
      const tripType = req.body.tripType || booking.tripType;
      const passengers = req.body.passengers || booking.passengers;

      if (tripType === 'one-way') {
        totalPrice = transfer.oneWayPrice * passengers;
      } else {
        totalPrice = transfer.roundTripPrice * passengers;
      }

      req.body.totalPrice = totalPrice;
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
        'airportName airportCode oneWayPrice roundTripPrice vehicleType'
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
        'airportName airportCode oneWayPrice roundTripPrice vehicleType'
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
      'airportName airportCode oneWayPrice roundTripPrice vehicleType'
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
