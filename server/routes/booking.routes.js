const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Optional auth middleware - doesn't fail if no token, just sets req.user if token exists
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (req.user) {
        console.log('✅ Optional auth: User found:', req.user.email);
      }
    } catch (err) {
      // Token invalid, but continue without user
      console.log('⚠️ Optional auth: Token invalid, continuing without user');
    }
  }
  next();
};

// Route to create a booking - optional auth (if logged in, use their email)
router.post('/', optionalAuth, bookingController.createBooking);

// Route to get all bookings (admin only)
router.get('/', protect, bookingController.getAllBookings);

// Route to get booking by reference number
router.get('/reference/:reference', bookingController.getBookingByReference);

// Route to convert booking price to another currency
router.get('/:id/convert/:toCurrency', bookingController.convertBookingPrice);

// Route to get, update or delete a booking by ID
router.get('/:id', protect, bookingController.getBookingById);
router.put('/:id', protect, bookingController.updateBookingStatus);
router.delete('/:id', protect, bookingController.deleteBooking);

module.exports = router;