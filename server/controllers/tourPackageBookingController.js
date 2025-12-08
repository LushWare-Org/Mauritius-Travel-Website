const TourPackageBooking = require('../models/TourPackageBooking');
const TourPackage = require('../models/TourPackage');
const AirportTransferBooking = require('../models/AirportTransferBooking');
const User = require('../models/User');


// @desc    Create tour package booking with airport transfer
// @route   POST /api/v1/tour-package-bookings/with-transfer
// @access  Public
exports.createBookingWithTransfer = async (req, res, next) => {
  try {
    // Check if tour package exists
    const tourPackage = await TourPackage.findById(req.body.tourPackage);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        error: 'Tour package not found'
      });
    }

    // Calculate base price
    const packagePrice = tourPackage.price;
    const guests = req.body.guests || 1;
    const baseTotal = packagePrice * guests;

    // Calculate activities total
    let activitiesTotal = 0;
    if (req.body.selectedActivities && req.body.selectedActivities.length > 0) {
      activitiesTotal = req.body.selectedActivities.reduce((sum, activity) => {
        return sum + (activity.price || 0) * guests;
      }, 0);
    }

    // Calculate transfer total
    let transferTotal = 0;
    let airportTransferBooking = null;
    
    if (req.body.airportTransfer && req.body.airportTransfer.transferId) {
      // Create separate airport transfer booking
      const transferData = {
        transfer: req.body.airportTransfer.transferId,
        guestName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        flightNumber: req.body.flightNumber || '',
        arrivalDate: req.body.airportTransfer.arrivalDate,
        arrivalTime: req.body.airportTransfer.arrivalTime,
        departureDate: req.body.airportTransfer.departureDate || null,
        departureTime: req.body.airportTransfer.departureTime || null,
        tripType: req.body.airportTransfer.tripType,
        transferType: req.body.airportTransfer.transferType,
        passengers: guests,
        specialRequests: req.body.specialRequests || '',
        totalPrice: req.body.airportTransfer.transferPrice,
        // Link to tour package booking
        tourPackageBooking: null // Will be updated after creation
      };

      // Add user if authenticated
      if (req.user) {
        transferData.user = req.user.id;
      }

      airportTransferBooking = await AirportTransferBooking.create(transferData);
      transferTotal = req.body.airportTransfer.transferPrice;
    }

    // Calculate total price
    const totalPrice = baseTotal + activitiesTotal + transferTotal;

    // Prepare tour package booking data
    const bookingData = {
      tourPackage: req.body.tourPackage,
      user: req.user ? req.user.id : null,
      guests: guests,
      startDate: req.body.startDate,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      specialRequests: req.body.specialRequests || '',
      totalPrice: totalPrice,
      packagePrice: packagePrice,
      activitiesTotal: activitiesTotal,
      transferTotal: transferTotal,
      selectedActivities: req.body.selectedActivities || [],
      status: 'pending'
    };

    // Link airport transfer booking if exists
    if (airportTransferBooking) {
      bookingData.airportTransferBooking = airportTransferBooking._id;
    }

    const booking = await TourPackageBooking.create(bookingData);

    // Update airport transfer booking with tour package booking reference
    if (airportTransferBooking) {
      airportTransferBooking.tourPackageBooking = booking._id;
      await airportTransferBooking.save();
    }

    // Populate the booking
    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price image location')
      .populate('airportTransferBooking')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking with transfer:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    next(error);
  }
};

// @desc    Get tour package booking with transfer details
// @route   GET /api/v1/tour-package-bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await TourPackageBooking.findById(req.params.id)
      .populate('tourPackage', 'title price image location description duration')
      .populate({
        path: 'airportTransferBooking',
        populate: {
          path: 'transfer',
          select: 'airportName airportCode vehicleType oneWayPrice roundTripPrice'
        }
      })
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    if (req.user) {
      if (booking.user && booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access this booking'
        });
      }
    }

    // Format the response to include all necessary data
    const formattedBooking = {
      ...booking.toObject(),
      // Ensure activities data is included
      selectedActivities: booking.selectedActivities || [],
      activitiesTotal: booking.activitiesTotal || 0,
      transferTotal: booking.transferTotal || 0,
      packagePrice: booking.packagePrice || booking.tourPackage?.price || 0
    };

    res.status(200).json({
      success: true,
      data: formattedBooking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    next(error);
  }
};


// Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await TourPackageBooking.find()
      .populate('tourPackage', 'title price duration location image')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings', error: error.message });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await TourPackageBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await booking.remove();

    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Error deleting booking', error: error.message });
  }
};

// @desc    Get user's upcoming tour package bookings
// @route   GET /api/v1/tour-package-bookings/upcoming
// @access  Private
exports.getUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await TourPackageBooking.find({
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('tourPackage', 'title price duration location image')
    .sort({ startDate: 1 })
    .lean();

    // Filter upcoming bookings (start date is in the future)
    const upcomingBookings = bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      const now = new Date();
      return startDate > now;
    });

    res.status(200).json({
      success: true,
      count: upcomingBookings.length,
      data: upcomingBookings
    });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming bookings',
      error: error.message
    });
  }
};

// @desc    Get user's tour package booking history
// @route   GET /api/v1/tour-package-bookings/history
// @access  Private
exports.getBookingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await TourPackageBooking.find({ user: userId })
      .populate('tourPackage', 'title price duration location image')
      .sort({ createdAt: -1 })
      .lean();

    // Process bookings to mark past confirmed bookings as completed
    const processedBookings = bookings.map(booking => {
      const bookingDate = new Date(booking.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today && booking.status === 'confirmed') {
        return { ...booking, status: 'completed' };
      }
      
      return booking;
    });

    res.status(200).json({
      success: true,
      count: processedBookings.length,
      data: processedBookings
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking history',
      error: error.message
    });
  }
};

// @desc    Get booking by ID
// @route   GET /api/v1/tour-package-bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    console.log('📥 GET /tour-package-bookings/:id called');
    console.log('📌 Request ID:', req.params.id);
    console.log('👤 User ID from token:', req.user?.id);
    console.log('👤 User Role:', req.user?.role);

    // Get booking with all fields
    const booking = await TourPackageBooking.findById(req.params.id).lean();

    if (!booking) {
      console.log('❌ Booking not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('✅ Booking found:', {
      id: booking._id,
      status: booking.status,
      userId: booking.user,
      tourPackageId: booking.tourPackage,
      hasSelectedActivities: !!booking.selectedActivities,
      selectedActivitiesCount: booking.selectedActivities?.length || 0,
      selectedActivities: booking.selectedActivities,
      activitiesTotal: booking.activitiesTotal,
      totalPrice: booking.totalPrice
    });

    // Check authorization
    const bookingUserId = booking.user?.toString();
    const requestUserId = req.user?.id;
    
    console.log('🔐 Authorization check:', {
      bookingUserId,
      requestUserId,
      isSameUser: bookingUserId === requestUserId,
      isAdmin: req.user?.role === 'admin'
    });

    if (bookingUserId !== requestUserId && req.user?.role !== 'admin') {
      console.log('⛔ Unauthorized access attempt');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    // Now populate with safe queries
    const populatedBooking = await TourPackageBooking.findById(req.params.id)
      .populate('tourPackage', 'title price duration location images description itinerary')
      .populate('user', 'name email phone')
      .lean();

    // Add fallback logic for missing fields
    const safeBooking = {
      ...populatedBooking,
      // Ensure all required fields exist
      tourPackage: populatedBooking.tourPackage || {
        title: 'Unknown Package',
        price: 0,
        duration: 'N/A',
        location: 'Unknown',
        images: []
      },
      user: populatedBooking.user || {
        name: 'Unknown User',
        email: 'unknown@example.com'
      },
      // Ensure nested fields exist
      fullName: populatedBooking.fullName || populatedBooking.user?.name || 'Unknown',
      email: populatedBooking.email || populatedBooking.user?.email || 'unknown@example.com',
      phone: populatedBooking.phone || populatedBooking.user?.phone || 'N/A',
      specialRequests: populatedBooking.specialRequests || 'None',
      // Ensure activities fields exist
      selectedActivities: populatedBooking.selectedActivities || [],
      activitiesTotal: populatedBooking.activitiesTotal || 0,
      packagePrice: populatedBooking.packagePrice || populatedBooking.tourPackage?.price || 0
    };

    console.log('✅ Sending booking data with activities:', {
      selectedActivitiesCount: safeBooking.selectedActivities.length,
      activitiesTotal: safeBooking.activitiesTotal,
      packagePrice: safeBooking.packagePrice
    });
    
    res.status(200).json({
      success: true,
      data: safeBooking
    });
  } catch (error) {
    console.error('💥 Error in getBookingById:', error);
    console.error('Error stack:', error.stack);
    
    // Check for specific Mongoose errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create a new tour package booking
// @route   POST /api/v1/tour-package-bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { tourPackageId, fullName, email, phone, guests, startDate, specialRequests } = req.body;

    if (!tourPackageId || !fullName || !email || !phone || !guests || !startDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const tourPackage = await TourPackage.findById(tourPackageId);
    if (!tourPackage) return res.status(404).json({ success: false, message: 'Tour package not found' });
    if (tourPackage.status !== 'active') return res.status(400).json({ success: false, message: 'This tour package is not available for booking' });

    const totalPrice = tourPackage.price * guests;

    const booking = new TourPackageBooking({
      tourPackage: tourPackageId,
      user: req.user.id,
      fullName,
      email,
      phone,
      guests,
      startDate,
      totalPrice,
      packagePrice: tourPackage.price,
      specialRequests: specialRequests || '',
      status: 'pending'
    });

    await booking.save();

    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price duration location image');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Booking reference already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating booking', error: error.message });
  }
};

// @desc    Cancel a tour package booking
// @route   PUT /api/v1/tour-package-bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    console.log('🔄 Cancelling booking:', req.params.id);
    console.log('👤 Current user:', req.user.id);

    const booking = await TourPackageBooking.findById(req.params.id);

    if (!booking) {
      console.log('❌ Booking not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to cancel this booking
    const bookingUserId = booking.user?._id ? booking.user._id.toString() : booking.user?.toString();
    const currentUserId = req.user.id;

    console.log('🔐 Authorization check for cancel:', {
      bookingUserId,
      currentUserId,
      isAuthorized: bookingUserId === currentUserId
    });

    if (bookingUserId !== currentUserId) {
      console.log('⛔ Unauthorized cancel attempt');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled (at least 24 hours before start date)
    const startDate = new Date(booking.startDate);
    const now = new Date();
    const hoursDifference = (startDate - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({
        success: false,
        message: 'Bookings can only be cancelled at least 24 hours before the start date'
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    await booking.save();

    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price duration location image')
      .populate('user', 'name email');

    console.log('✅ Booking cancelled successfully');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: populatedBooking
    });

  } catch (error) {
    console.error('💥 Error cancelling booking:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Update booking status (admin only)
// @route   PUT /api/v1/tour-package-bookings/:id
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    console.log('Updating booking status:', req.params.id, req.body);

    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    const booking = await TourPackageBooking.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { 
        new: true,
        runValidators: false
      }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price duration location image')
      .populate('user', 'name email');
    
    console.log('Booking status updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: populatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// @desc    Get booking statistics for user dashboard
// @route   GET /api/v1/tour-package-bookings/stats
// @access  Private
exports.getBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalBookings = await TourPackageBooking.countDocuments({ user: userId });
    const pendingBookings = await TourPackageBooking.countDocuments({ 
      user: userId, 
      status: 'pending' 
    });
    const confirmedBookings = await TourPackageBooking.countDocuments({ 
      user: userId, 
      status: 'confirmed' 
    });

    const recentBookings = await TourPackageBooking.find({ user: userId })
      .populate('tourPackage', 'title image')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics',
      error: error.message
    });
  }
};

// @desc    Create a new tour package booking with activities
// @route   POST /api/v1/tour-package-bookings/with-activities
// @access  Private
const createBookingWithActivities = async (req, res) => {
  try {
    console.log('🎯 CREATE BOOKING WITH ACTIVITIES - START');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      tourPackage,
      guests,
      startDate,
      selectedActivities = [],
      specialRequests = '',
      totalPrice,
      packagePrice = 0,
      activitiesTotal = 0,
      transferTotal = 0,
      fullName,
      email,
      phone,
      airportTransfer
    } = req.body;

    console.log('📊 Booking data received in Rs:', {
      tourPackage,
      guests,
      startDate,
      selectedActivitiesCount: selectedActivities.length,
      totalPrice: `Rs ${totalPrice}`,
      packagePrice: `Rs ${packagePrice}`,
      activitiesTotal: `Rs ${activitiesTotal}`,
      transferTotal: `Rs ${transferTotal}`,
      user: req.user?.id
    });

    // Get user info
    const userId = req.user.id;
    const userName = fullName || req.user.name || 'Unknown';
    const userEmail = email || req.user.email;
    const userPhone = phone || req.user.phone || '';

    // Validate required fields
    if (!tourPackage || !guests || !startDate || !totalPrice) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields: tourPackage, guests, startDate, totalPrice'
      });
    }

    // Check if tour package exists
    const tourPackageDoc = await TourPackage.findById(tourPackage);
    if (!tourPackageDoc) {
      console.log('❌ Tour package not found:', tourPackage);
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }

    // Prepare activities data (keep prices in Rs)
    const activitiesData = selectedActivities.map((activity, index) => {
      console.log(`Processing activity ${index}:`, activity);
      
      const activityId = activity.activity || activity._id || activity.id;
      const activityTitle = activity.title || 'Unknown Activity';
      const activityPrice = Number(activity.price) || 0;
      const activityQuantity = Number(activity.quantity) || Number(guests);
      
      return {
        activity: activityId,
        title: activityTitle,
        price: activityPrice, // Keep in Rs
        quantity: activityQuantity
      };
    });

    console.log('✅ Prepared activities data (Rs):', activitiesData);

    // IMPORTANT: Use Rs values directly, no USD conversion
    const actualPackagePrice = Number(packagePrice) || Number(tourPackageDoc.price);
    
    // Calculate expected totals in Rs
    const expectedPackageTotal = actualPackagePrice * guests;
    const expectedActivitiesTotal = activitiesData.reduce(
      (sum, activity) => sum + (activity.price * activity.quantity),
      0
    );
    const expectedTransferTotal = Number(transferTotal) || 0;
    const expectedTotal = expectedPackageTotal + expectedActivitiesTotal + expectedTransferTotal;

    console.log('💰 Price validation (in Rs):', {
      actualPackagePrice: `Rs ${actualPackagePrice}`,
      expectedPackageTotal: `Rs ${expectedPackageTotal}`,
      expectedActivitiesTotal: `Rs ${expectedActivitiesTotal}`,
      expectedTransferTotal: `Rs ${expectedTransferTotal}`,
      expectedTotal: `Rs ${expectedTotal}`,
      receivedTotal: `Rs ${totalPrice}`,
      guests,
      activitiesCount: activitiesData.length
    });

    // Validate with tolerance for rounding
    const tolerance = 0.01;
    
    if (Math.abs(expectedTotal - totalPrice) > tolerance) {
      console.log('❌ Price mismatch detected');
      return res.status(400).json({
        success: false,
        message: `Price mismatch. Expected: Rs ${expectedTotal.toFixed(2)}, Received: Rs ${totalPrice.toFixed(2)}`,
        details: {
          expectedPackageTotal: expectedPackageTotal,
          expectedActivitiesTotal: expectedActivitiesTotal,
          expectedTransferTotal: expectedTransferTotal,
          expectedTotal: expectedTotal,
          receivedTotal: totalPrice,
          calculationBreakdown: {
            packagePrice: actualPackagePrice,
            guests,
            packageTotal: expectedPackageTotal,
            activities: activitiesData.map(a => ({
              title: a.title,
              price: `Rs ${a.price}`,
              quantity: a.quantity,
              subtotal: `Rs ${a.price * a.quantity}`
            })),
            activitiesTotal: expectedActivitiesTotal,
            transferTotal: expectedTransferTotal,
            grandTotal: expectedTotal
          }
        }
      });
    }

    // Create booking with Rs values
    const bookingData = {
      tourPackage,
      user: userId,
      fullName: userName,
      email: userEmail,
      phone: userPhone,
      guests: Number(guests),
      startDate: new Date(startDate),
      selectedActivities: activitiesData,
      totalPrice: Number(totalPrice),
      packagePrice: actualPackagePrice,
      activitiesTotal: Number(activitiesTotal) || expectedActivitiesTotal,
      transferTotal: Number(transferTotal) || 0,
      specialRequests: specialRequests || '',
      status: 'pending',
      currency: 'MUR' // Explicitly set currency to Mauritian Rupees
    };

    // Include transfer data if present
    if (airportTransfer) {
      bookingData.airportTransfer = {
        ...airportTransfer,
        transferPrice: Number(airportTransfer.transferPrice) || 0
      };
    }

    console.log('💾 Creating booking with data (in Rs):', {
      ...bookingData,
      totalPrice: `Rs ${bookingData.totalPrice}`,
      packagePrice: `Rs ${bookingData.packagePrice}`,
      activitiesTotal: `Rs ${bookingData.activitiesTotal}`,
      transferTotal: `Rs ${bookingData.transferTotal}`
    });

    const booking = new TourPackageBooking(bookingData);
    await booking.save();

    console.log('✅ Booking created successfully with reference:', booking.bookingReference);

    // Populate and return
    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price duration location image')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Tour package booking created successfully'
    });

  } catch (error) {
    console.error('💥 Error creating booking with activities:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booking reference already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// @desc    Test booking reference generation
// @route   POST /api/v1/tour-package-bookings/test-reference
// @access  Private
exports.testBookingReference = async (req, res) => {
  try {
    const testBooking = new TourPackageBooking({
      tourPackage: '65f8c1a2b3c4d5e6f7a8b9c0',
      user: req.user.id,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      guests: 2,
      startDate: new Date(),
      totalPrice: 100,
      packagePrice: 50,
      status: 'pending'
    });
    
    await testBooking.save();
    
    res.status(200).json({
      success: true,
      message: 'Test booking created',
      bookingReference: testBooking.bookingReference
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

// @desc    Test pre-save hook
// @route   POST /api/v1/tour-package-bookings/test-pre-save
// @access  Private
exports.testPreSaveHook = async (req, res) => {
  try {
    console.log('=== TESTING PRE-SAVE HOOK ===');
    
    const testBooking = new TourPackageBooking({
      tourPackage: '65f8c1a2b3c4d5e6f7a8b9c0',
      user: req.user.id,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      guests: 2,
      startDate: new Date(),
      totalPrice: 100,
      packagePrice: 50,
      status: 'pending'
    });
    
    console.log('Before save - bookingReference:', testBooking.bookingReference);
    
    await testBooking.save();
    
    console.log('After save - bookingReference:', testBooking.bookingReference);
    
    res.status(200).json({
      success: true,
      message: 'Test completed',
      beforeSave: 'No reference',
      afterSave: testBooking.bookingReference,
      bookingId: testBooking._id
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
      stack: error.stack
    });
  }
};

// Export the createBookingWithActivities function
exports.createBookingWithActivities = createBookingWithActivities;