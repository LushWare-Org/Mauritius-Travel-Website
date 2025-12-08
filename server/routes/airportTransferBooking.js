const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  getUserBookings,
  getBookingStats,
  updateBooking,
  deleteBooking,
  getGuestBooking  // Add this import
} = require('../controllers/airportTransferBooking.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/', createBooking);
router.get('/guest/:reference', getGuestBooking); // Add this route for guest access

// User routes
router.get('/user/my-bookings', protect, getUserBookings);

// Admin routes
router.get('/', protect, authorize('admin'), getBookings);
router.get('/stats', protect, authorize('admin'), getBookingStats);
router.get('/:id', protect, getBooking);
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.delete('/:id', protect, authorize('admin'), deleteBooking);

module.exports = router;