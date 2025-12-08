const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  deleteBooking,
  getUpcomingBookings,
  getBookingHistory,
  getBookingStats,
  updateBookingStatus,
  createBookingWithActivities,
  createBookingWithTransfer,
  testPreSaveHook 
} = require('../controllers/tourPackageBookingController');

// Public routes (if any)

// Protected routes
router.use(protect);

// User routes
router.get('/', getAllBookings);
router.get('/upcoming', getUpcomingBookings);
router.get('/history', getBookingHistory);
router.get('/stats', getBookingStats);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.post('/with-activities', createBookingWithActivities); 
router.put('/:id/cancel', cancelBooking);  
router.delete('/:id', deleteBooking);
router.post('/test-presave', testPreSaveHook);
router.post('/with-transfer', protect, createBookingWithTransfer);

// Admin only routes
router.get('/admin/all', authorize('admin'), getAllBookings);
router.put('/:id/status', authorize('admin'), updateBookingStatus);  
router.put('/:id', authorize('admin'), updateBookingStatus);

module.exports = router;