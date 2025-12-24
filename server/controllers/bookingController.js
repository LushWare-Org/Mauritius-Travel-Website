const Booking = require('../models/Booking');
const Activity = require('../models/Activity');

// Helper function to get exchange rate (you can fetch from an API or set a fixed rate)
const getExchangeRate = () => {
  // For now, use a fixed exchange rate
  // You can update this to fetch from an external API
  return {
    EUR_TO_MUR: 49.5, // 1 EUR = 49.5 MUR
    MUR_TO_EUR: 0.0202 // 1 MUR = 0.0202 EUR
  };
};

// @desc    Create a new booking
// @route   POST /api/v1/bookings
// @access  Public
exports.createBooking = async (req, res) => {
  try {
    console.log('📝 Creating new booking...');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
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
    console.log('💰 Selected currency:', req.body.currency || 'MUR');

    // Get exchange rate
    const exchangeRate = getExchangeRate();
    
    // Calculate prices based on selected currency
    const selectedCurrency = req.body.currency || 'MUR';
    let pricePerPerson = req.body.pricePerPerson;
    let totalPrice = req.body.totalPrice;
    
    // If prices are not provided in request, calculate them from activity
    if (!pricePerPerson || !totalPrice) {
      // Get price from activity based on duration
      let activityPrice;
      if (req.body.durationType === 'Half Day') {
        activityPrice = selectedCurrency === 'MUR' ? activity.halfDayPriceMUR : activity.halfDayPriceEUR;
      } else if (req.body.durationType === 'Full Day') {
        activityPrice = selectedCurrency === 'MUR' ? activity.fullDayPriceMUR : activity.fullDayPriceEUR;
      } else {
        activityPrice = selectedCurrency === 'MUR' ? activity.priceMUR : activity.priceEUR;
      }
      
      pricePerPerson = activityPrice;
      totalPrice = activityPrice * req.body.guests;
    }
    
    // Calculate prices in both currencies
    let prices = {
      EUR: {},
      MUR: {}
    };
    
    if (selectedCurrency === 'MUR') {
      prices.MUR.pricePerPerson = pricePerPerson;
      prices.MUR.totalPrice = totalPrice;
      // Convert to EUR
      prices.EUR.pricePerPerson = Math.round((pricePerPerson * exchangeRate.MUR_TO_EUR) * 100) / 100;
      prices.EUR.totalPrice = Math.round((totalPrice * exchangeRate.MUR_TO_EUR) * 100) / 100;
    } else {
      prices.EUR.pricePerPerson = pricePerPerson;
      prices.EUR.totalPrice = totalPrice;
      // Convert to MUR
      prices.MUR.pricePerPerson = Math.round(pricePerPerson * exchangeRate.EUR_TO_MUR);
      prices.MUR.totalPrice = Math.round(totalPrice * exchangeRate.EUR_TO_MUR);
    }
    
    console.log('💵 Calculated prices:', {
      selectedCurrency,
      pricePerPerson,
      totalPrice,
      prices
    });

    // If user is logged in, use their email instead of form email
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
      durationType: req.body.durationType || null,
      currency: selectedCurrency,
      pricePerPerson: pricePerPerson,
      totalPrice: totalPrice,
      prices: prices,
      fullName: req.body.fullName,
      email: bookingEmail,
      phone: req.body.phone,
      countryCode: req.body.countryCode || '+230',
      specialRequests: req.body.specialRequests
    });

    console.log('✅ Booking created successfully:', booking._id);
    console.log('📊 Booking data:', {
      _id: booking._id,
      bookingReference: booking.bookingReference,
      activity: booking.activity,
      currency: booking.currency,
      pricePerPerson: booking.pricePerPerson,
      totalPrice: booking.totalPrice,
      fullName: booking.fullName,
      email: booking.email,
      loggedInUser: req.user ? req.user.email : 'Not logged in'
    });

    res.status(201).json({
      success: true,
      data: booking,
      exchangeRate: exchangeRate
    });
  } catch (err) {
    console.error('❌ Error creating booking:', err);
    console.error('❌ Error details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      errors: err.errors
    });
    
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
    
    // Populate activity details
    const bookings = await Booking.find().populate('activity', 'title image priceMUR priceEUR halfDayPriceMUR halfDayPriceEUR fullDayPriceMUR fullDayPriceEUR pricingType');
    
    console.log(`✅ Retrieved ${bookings.length} bookings`);
    
    // Add exchange rate information
    const exchangeRate = getExchangeRate();
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
      exchangeRate: exchangeRate
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
    
    // Add exchange rate information
    const exchangeRate = getExchangeRate();
    
    res.status(200).json({
      success: true,
      data: booking,
      exchangeRate: exchangeRate
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
    
    // Add exchange rate information
    const exchangeRate = getExchangeRate();
    
    res.status(200).json({
      success: true,
      data: booking,
      exchangeRate: exchangeRate
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
    
    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('activity');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Add exchange rate information
    const exchangeRate = getExchangeRate();
    
    res.status(200).json({
      success: true,
      data: booking,
      exchangeRate: exchangeRate
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

// @desc    Convert booking price to another currency
// @route   GET /api/v1/bookings/:id/convert/:toCurrency
// @access  Public
exports.convertBookingPrice = async (req, res) => {
  try {
    const { id, toCurrency } = req.params;
    
    if (!['EUR', 'MUR'].includes(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency. Use EUR or MUR'
      });
    }
    
    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    const exchangeRate = getExchangeRate();
    let convertedPrice;
    
    if (booking.currency === toCurrency) {
      // Same currency, no conversion needed
      convertedPrice = {
        pricePerPerson: booking.pricePerPerson,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        currencySymbol: booking.currencySymbol
      };
    } else {
      // Convert currency
      if (booking.currency === 'MUR' && toCurrency === 'EUR') {
        convertedPrice = {
          pricePerPerson: Math.round((booking.pricePerPerson * exchangeRate.MUR_TO_EUR) * 100) / 100,
          totalPrice: Math.round((booking.totalPrice * exchangeRate.MUR_TO_EUR) * 100) / 100,
          currency: 'EUR',
          currencySymbol: '€'
        };
      } else {
        convertedPrice = {
          pricePerPerson: Math.round(booking.pricePerPerson * exchangeRate.EUR_TO_MUR),
          totalPrice: Math.round(booking.totalPrice * exchangeRate.EUR_TO_MUR),
          currency: 'MUR',
          currencySymbol: 'Rs'
        };
      }
    }
    
    res.status(200).json({
      success: true,
      data: convertedPrice,
      original: {
        pricePerPerson: booking.pricePerPerson,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        currencySymbol: booking.currencySymbol
      },
      exchangeRate: exchangeRate
    });
    
  } catch (err) {
    console.error('❌ Error converting booking price:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.getUserUpcomingBookings = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Make sure to include ALL fields
    const bookings = await Booking.find({ 
      email: userEmail,
      date: { $gte: new Date() } // upcoming bookings
    })
    .populate('activity', 'title image location')
    .select('+prices') // Explicitly include prices field
    .sort({ date: 1 }); // Sort by date ascending
    
    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (err) {
    console.error('Error fetching user upcoming bookings:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};