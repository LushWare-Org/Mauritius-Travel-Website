const express = require('express');
const router = express.Router();
const { 
  submitContactForm,
  getAllContacts,
  getContactById,
  updateContactStatus,
  replyToContact,
  deleteContact,
  getContactStats,
  getContactCounts
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public route
router.post('/', submitContactForm);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllContacts);
router.get('/stats', protect, authorize('admin'), getContactStats);
router.get('/counts', protect, authorize('admin'), getContactCounts);
router.get('/:id', protect, authorize('admin'), getContactById);
router.put('/:id/status', protect, authorize('admin'), updateContactStatus);
router.post('/:id/reply', protect, authorize('admin'), replyToContact);
router.delete('/:id', protect, authorize('admin'), deleteContact);

module.exports = router;