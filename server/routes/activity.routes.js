const express = require('express');
const router = express.Router();
const {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity
} = require('../controllers/activityController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.route('/').get(getActivities);
router.route('/:id').get(getActivity);

// Protected routes (admin only)
router.route('/').post(protect, authorize('admin'), createActivity);
router.route('/:id')
  .put(protect, authorize('admin'), updateActivity)
  .delete(protect, authorize('admin'), deleteActivity);

module.exports = router;