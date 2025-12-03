const express = require('express');
const router = express.Router();
const { getUserContacts } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

// Protect all routes in this file
router.use(protect);

// Get user's contact inquiries (requires login)
router.get('/', getUserContacts);

module.exports = router;