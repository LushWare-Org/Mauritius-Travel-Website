const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const tourPackageBookingController = require('../controllers/tourPackageBookingController');

// Public routes (if any)

// Protected routes
router.use(protect);

// User routes
router.get('/', tourPackageBookingController.getAllBookings);
router.get('/upcoming', tourPackageBookingController.getUpcomingBookings);
router.get('/history', tourPackageBookingController.getBookingHistory);
router.get('/stats', tourPackageBookingController.getBookingStats);
router.get('/:id', tourPackageBookingController.getBookingById);
router.post('/', tourPackageBookingController.createBooking);
router.post('/with-activities', tourPackageBookingController.createBookingWithActivities); 
router.put('/:id/cancel', tourPackageBookingController.cancelBooking);  
router.delete('/:id', tourPackageBookingController.deleteBooking);
router.post('/test-presave', tourPackageBookingController.testPreSaveHook);
router.post('/with-transfer', protect, tourPackageBookingController.createBookingWithTransfer);

// Admin only routes
router.get('/admin/all', authorize('admin'), tourPackageBookingController.getAllBookings);
router.put('/:id/status', authorize('admin'), tourPackageBookingController.updateBookingStatus);  
router.put('/:id', authorize('admin'), tourPackageBookingController.updateBookingStatus);

// Add this new route for getting tour package price in specific currency
// Note: This should actually be in tourPackage routes, not booking routes
// But I'll include it here if that's where you want it
router.get('/:id/price/:currency', tourPackageBookingController.getPackagePriceInCurrency);

module.exports = router;