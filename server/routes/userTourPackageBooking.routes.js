const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createTourPackageBooking } = require('../controllers/userTourPackageBookingControlller');

router.use(protect);

// POST /api/v1/user/tour-package-bookings
router.post('/', createTourPackageBooking);

module.exports = router;
