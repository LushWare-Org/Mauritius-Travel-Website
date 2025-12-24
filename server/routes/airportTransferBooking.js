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
  getGuestBooking
} = require('../controllers/airportTransferBooking.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/', createBooking);
router.get('/guest/:reference', getGuestBooking);

// User routes
router.get('/user/my-bookings', protect, getUserBookings);

// Admin routes
router.get('/', protect, authorize('admin'), getBookings);
router.get('/stats', protect, authorize('admin'), getBookingStats);
router.get('/:id', protect, authorize('admin'), getBooking);
router.put('/:id', protect, authorize('admin'), updateBooking);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.delete('/:id', protect, authorize('admin'), deleteBooking);

module.exports = router;