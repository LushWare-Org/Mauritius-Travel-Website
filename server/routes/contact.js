const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public route - anyone can submit contact form
router.post('/', contactController.submitContactForm);

// Protected routes - require authentication
router.use(protect);

// User routes - logged in users can view their inquiries
router.get('/user', contactController.getUserContacts);

// Admin routes only
router.use(authorize('admin'));

// Admin contact management routes
router.get('/', contactController.getAllContacts);
router.get('/stats', contactController.getContactStats);
router.get('/counts', contactController.getContactCounts);
router.get('/:id', contactController.getContactById);
router.put('/:id/status', contactController.updateContactStatus);
router.post('/:id/reply', contactController.replyToContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;