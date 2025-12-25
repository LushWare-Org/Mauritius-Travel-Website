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
    const { currency } = req.query; // NEW: Filter by currency
    
    let query = {};
    if (currency && (currency === 'MUR' || currency === 'EUR')) {
      query.currency = currency;
    }
    
    const bookings = await TourPackageBooking.find(query)
      .populate('tourPackage', 'title price priceEur supportsCurrency duration location image')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Format response with currency info
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      displayCurrency: booking.currency || 'MUR',
      displayPrice: booking.currency === 'EUR' ? 
        (booking.totalPriceEur || booking.totalPrice) : 
        (booking.totalPriceMur || booking.totalPrice)
    }));

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: formattedBookings,
      currencyFilter: currency || 'all'
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching bookings', 
      error: error.message 
    });
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

// @desc    Get booking by ID with dual currency support
// @route   GET /api/v1/tour-package-bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    console.log('📥 GET /tour-package-bookings/:id called with dual currency');
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
      currency: booking.currency || 'MUR',
      status: booking.status,
      userId: booking.user,
      totalPrice: booking.totalPrice,
      totalPriceEur: booking.totalPriceEur || 0,
      packagePrice: booking.packagePrice,
      packagePriceEur: booking.packagePriceEur || 0
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
      .populate('tourPackage', 'title price priceEur supportsCurrency duration location images description itinerary')
      .populate('user', 'name email phone')
      .lean();

    // Add fallback logic for missing fields
    const safeBooking = {
      ...populatedBooking,
      // Ensure all required fields exist
      tourPackage: populatedBooking.tourPackage || {
        title: 'Unknown Package',
        price: 0,
        priceEur: 0,
        supportsCurrency: 'rs-only',
        duration: 'N/A',
        location: 'Unknown',
        images: []
      },
      user: populatedBooking.user || {
        name: 'Unknown User',
        email: 'unknown@example.com'
      },
      // Ensure currency fields
      currency: populatedBooking.currency || 'MUR',
      // Ensure nested fields exist
      fullName: populatedBooking.fullName || populatedBooking.user?.name || 'Unknown',
      email: populatedBooking.email || populatedBooking.user?.email || 'unknown@example.com',
      phone: populatedBooking.phone || populatedBooking.user?.phone || 'N/A',
      specialRequests: populatedBooking.specialRequests || 'None',
      // Ensure activities fields exist
      selectedActivities: populatedBooking.selectedActivities || [],
      activitiesTotal: populatedBooking.activitiesTotal || 0,
      activitiesTotalEur: populatedBooking.activitiesTotalEur || 0,
      packagePrice: populatedBooking.packagePrice || populatedBooking.tourPackage?.price || 0,
      packagePriceEur: populatedBooking.packagePriceEur || populatedBooking.tourPackage?.priceEur || 0
    };

    console.log('✅ Sending booking data with currency:', safeBooking.currency);
    
    res.status(200).json({
      success: true,
      data: safeBooking,
      currency: safeBooking.currency
    });
  } catch (error) {
    console.error('💥 Error in getBookingById:', error);
    console.error('Error stack:', error.stack);
    
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

// @desc    Create a new tour package booking with dual currency
// @route   POST /api/v1/tour-package-bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const { 
      tourPackageId, 
      fullName, 
      email, 
      phone, 
      guests, 
      startDate, 
      specialRequests,
      currency = 'MUR'
    } = req.body;

    if (!tourPackageId || !fullName || !email || !phone || !guests || !startDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const tourPackage = await TourPackage.findById(tourPackageId);
    if (!tourPackage) return res.status(404).json({ 
      success: false, 
      message: 'Tour package not found' 
    });
    
    if (tourPackage.status !== 'active') return res.status(400).json({ 
      success: false, 
      message: 'This tour package is not available for booking' 
    });

    // Get price based on currency
    let packagePrice, totalPrice;
    if (currency === 'EUR' && tourPackage.priceEur) {
      packagePrice = tourPackage.priceEur;
    } else {
      packagePrice = tourPackage.price;
    }
    
    totalPrice = packagePrice * guests;

    const booking = new TourPackageBooking({
      tourPackage: tourPackageId,
      user: req.user.id,
      fullName,
      email,
      phone,
      guests,
      startDate,
      currency: currency,
      totalPrice: totalPrice,
      totalPriceEur: currency === 'EUR' ? totalPrice : 0,
      totalPriceMur: currency === 'MUR' ? totalPrice : 0,
      packagePrice: packagePrice,
      packagePriceEur: currency === 'EUR' ? packagePrice : 0,
      specialRequests: specialRequests || '',
      status: 'pending'
    });

    await booking.save();

    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price priceEur supportsCurrency duration location image');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking,
      currency: currency
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking reference already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating booking', 
      error: error.message 
    });
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
      .populate('tourPackage', 'title price priceEur supportsCurrency duration location image')
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
      .populate('tourPackage', 'title price priceEur supportsCurrency duration location image')
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

// @desc    Create a new tour package booking with activities (FIXED VERSION)
// @route   POST /api/v1/tour-package-bookings/with-activities
// @access  Private
exports.createBookingWithActivities = async (req, res) => {
  try {
    console.log('🎯 CREATE BOOKING WITH ACTIVITIES - FIXED VERSION');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      tourPackageId,
      guests = 1,
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
      airportTransferBooking,
      currency = 'MUR'
    } = req.body;

    console.log('📊 Booking data received:', {
      tourPackageId,
      guests,
      startDate,
      currency,
      totalPrice,
      packagePrice,
      activitiesTotal,
      transferTotal,
      selectedActivitiesCount: selectedActivities.length
    });

    // Get user info
    const userId = req.user.id;
    const userName = fullName || req.user.name || 'Unknown';
    const userEmail = email || req.user.email;
    const userPhone = phone || req.user.phone || '';

    // Validate required fields
    if (!tourPackageId || !startDate || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields: tourPackageId, startDate, totalPrice'
      });
    }

    // Check if tour package exists
    const tourPackageDoc = await TourPackage.findById(tourPackageId);
    if (!tourPackageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }

    // Prepare activities data
    const activitiesData = selectedActivities.map((activity) => {
      // Use the price that's already calculated from frontend
      const activityPrice = Number(activity.price) || 0;
      const activityPriceEur = Number(activity.priceEur) || 0;
      
      return {
        activity: activity.activityId || activity._id || activity.id,
        title: activity.title || 'Unknown Activity',
        price: currency === 'MUR' ? activityPrice : 0,
        priceEur: currency === 'EUR' ? activityPriceEur : 0,
        quantity: Number(activity.quantity) || Number(guests) || 1,
        currency: currency,
        duration: activity.duration || null,
        durationType: activity.durationType || null
      };
    });

    console.log('✅ Prepared activities data (count:', activitiesData.length, ')');
    console.log('💰 Prices breakdown:', {
      totalPrice,
      packagePrice,
      activitiesTotal,
      transferTotal,
      currency
    });

    // Create booking - FIXED: Store prices correctly based on currency
    const bookingData = {
      tourPackage: tourPackageId,
      user: userId,
      fullName: userName,
      email: userEmail,
      phone: userPhone,
      guests: Number(guests),
      startDate: new Date(startDate),
      selectedActivities: activitiesData,
      currency: currency,
      totalPrice: Number(totalPrice),
      // Store in both currencies
      totalPriceEur: currency === 'EUR' ? Number(totalPrice) : 0,
      totalPriceMur: currency === 'MUR' ? Number(totalPrice) : 0,
      // Package price
      packagePrice: currency === 'MUR' ? Number(packagePrice) : 0,
      packagePriceEur: currency === 'EUR' ? Number(packagePrice) : 0,
      // Activities total - FIXED: Use the values from frontend
      activitiesTotal: currency === 'MUR' ? Number(activitiesTotal) : 0,
      activitiesTotalEur: currency === 'EUR' ? Number(activitiesTotal) : 0,
      // Transfer total - FIXED: Use the values from frontend
      transferTotal: currency === 'MUR' ? Number(transferTotal) : 0,
      transferTotalEur: currency === 'EUR' ? Number(transferTotal) : 0,
      specialRequests: specialRequests || '',
      status: 'pending',
      paymentStatus: 'pending'
    };

    // Link airport transfer booking if provided
    if (airportTransferBooking && airportTransferBooking._id) {
      bookingData.airportTransferBooking = airportTransferBooking._id;
    }

    console.log('💾 Creating booking with data:', {
      ...bookingData,
      selectedActivitiesCount: bookingData.selectedActivities.length
    });

    const booking = new TourPackageBooking(bookingData);
    await booking.save();

    console.log('✅ Booking created successfully! Reference:', booking.bookingReference);
    console.log('📊 Stored prices:', {
      activitiesTotal: booking.activitiesTotal,
      activitiesTotalEur: booking.activitiesTotalEur,
      transferTotal: booking.transferTotal,
      transferTotalEur: booking.transferTotalEur,
      totalPrice: booking.totalPrice,
      currency: booking.currency
    });

    // Populate and return
    const populatedBooking = await TourPackageBooking.findById(booking._id)
      .populate('tourPackage', 'title price priceEur supportsCurrency duration location image')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedBooking,
      currency: currency,
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
      error: error.message,
      stack: error.stack
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

// @desc    Get tour package price in specific currency
// @route   GET /api/v1/tour-packages/:id/price/:currency
// @access  Public
exports.getPackagePriceInCurrency = async (req, res) => {
  try {
    const { id, currency } = req.params;
    
    const tourPackage = await TourPackage.findById(id);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: 'Tour package not found'
      });
    }
    
    let price;
    if (currency === 'EUR' && tourPackage.priceEur) {
      price = tourPackage.priceEur;
    } else if (currency === 'MUR') {
      price = tourPackage.price;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Currency not supported for this tour package'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        tourPackageId: id,
        currency: currency,
        price: price,
        supportsCurrency: tourPackage.supportsCurrency || 'rs-only',
        originalPrice: tourPackage.price,
        priceEur: tourPackage.priceEur || 0
      }
    });
  } catch (error) {
    console.error('Error getting package price:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching package price',
      error: error.message
    });
  }
};