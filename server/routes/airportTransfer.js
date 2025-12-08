const express = require('express');
const router = express.Router();
const {
  getTransfers,
  getTransfer,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  getActiveTransfers
} = require('../controllers/airportTransfer.controller');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/active', getActiveTransfers);
router.get('/:id', getTransfer);

// Protected routes (admin only)
router.get('/', protect, authorize('admin'), getTransfers);
router.post('/', protect, authorize('admin'), createTransfer);
router.put('/:id', protect, authorize('admin'), updateTransfer);
router.delete('/:id', protect, authorize('admin'), deleteTransfer);

module.exports = router;