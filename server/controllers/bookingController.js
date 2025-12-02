const Booking = require('../models/Booking');
const Activity = require('../models/Activity');

// @desc    Create a new booking
// @route   POST /api/v1/bookings
// @access  Public
exports.createBooking = async (req, res) => {
  try {
    console.log('📝 Creating new booking...');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected! Connection state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
    
    console.log('✅ Database connection verified');
    
    // Check if the activity exists
    const activity = await Activity.findById(req.body.activityId);
    if (!activity) {
      console.error('❌ Activity not found:', req.body.activityId);
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }
    
    console.log('✅ Activity found:', activity.title);

    // If user is logged in, use their email instead of form email
    // This ensures bookings are linked to the logged-in user
    let bookingEmail = req.body.email;
    if (req.user && req.user.email) {
      console.log('👤 User is logged in, using logged-in email:', req.user.email);
      console.log('📧 Form email was:', req.body.email);
      bookingEmail = req.user.email;
    } else {
      console.log('⚠️ No logged-in user, using form email:', req.body.email);
    }

    // Create a new booking
    const booking = await Booking.create({
      activity: req.body.activityId,
      bookingReference: req.body.bookingReference,
      date: new Date(req.body.date),
      guests: req.body.guests,
      totalPrice: req.body.totalPrice,
      fullName: req.body.fullName,
      email: bookingEmail, // Use logged-in user's email if available
      phone: req.body.phone,
      specialRequests: req.body.specialRequests
    });

    console.log('✅ Booking created successfully:', booking._id);
    console.log('📊 Booking data:', {
      _id: booking._id,
      bookingReference: booking.bookingReference,
      activity: booking.activity,
      fullName: booking.fullName,
      email: booking.email,
      loggedInUser: req.user ? req.user.email : 'Not logged in'
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    console.error('❌ Error creating booking:', err);
    console.error('❌ Error details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      errors: err.errors
    });
    
    // More detailed error response
    let errorMessage = err.message;
    if (err.errors) {
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      errorMessage = `Validation errors: ${JSON.stringify(validationErrors)}`;
    }
    
    res.status(400).json({
      success: false,
      error: errorMessage,
      details: err.errors || undefined
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private (Admin only)
exports.getAllBookings = async (req, res) => {
  try {
    console.log('📋 Fetching all bookings (admin)');
    
    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected!');
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
    
    const totalCount = await Booking.countDocuments();
    console.log(`📊 Total bookings in database: ${totalCount}`);
    
    const bookings = await Booking.find().populate('activity', 'title image');
    
    console.log(`✅ Retrieved ${bookings.length} bookings`);
    if (bookings.length > 0) {
      console.log('📝 Sample booking emails:', bookings.slice(0, 5).map(b => b.email));
    }
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    console.error('❌ Error fetching all bookings:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get a single booking
// @route   GET /api/v1/bookings/:id
// @access  Private (Admin or booking owner)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('activity');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get booking by reference number
// @route   GET /api/v1/bookings/reference/:reference
// @access  Public (with the reference number)
exports.getBookingByReference = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingReference: req.params.reference
    }).populate('activity');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/v1/bookings/:id
// @access  Private (Admin only)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private (Admin only)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
