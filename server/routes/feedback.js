// routes/feedback.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const TourPackage = require('../models/TourPackage'); // Changed from Package to TourPackage
const { protect } = require('../middleware/auth'); // Import protect middleware

// Submit feedback - PROTECTED ROUTE
router.post('/:packageId', protect, async (req, res) => {
  try {
    console.log('🔐 Feedback submission - User:', req.user.id);
    
    const { rating, comment } = req.body;
    const { packageId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated user

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid rating between 1 and 5'
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a comment'
      });
    }

    // Check if package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        error: 'Tour package not found'
      });
    }

    // Check if user already submitted feedback for this package
    const existingFeedback = await Feedback.findOne({
      packageId,
      userId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted feedback for this package'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      packageId,
      userId,
      rating,
      comment
    });

    await feedback.save();

    // Update package average rating
    const allFeedbacks = await Feedback.find({ packageId });
    
    const totalRatings = allFeedbacks.length;
    const averageRating = allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalRatings;

    tourPackage.averageRating = averageRating;
    tourPackage.totalRatings = totalRatings;
    await tourPackage.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
      averageRating,
      totalRatings
    });
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get package feedbacks - PUBLIC ROUTE (no auth required)
router.get('/package/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        error: 'Tour package not found'
      });
    }

    const feedbacks = await Feedback.find({ packageId })
      .populate('userId', 'name email') // Populate user details
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments({ packageId });

    res.json({
      success: true,
      feedbacks,
      averageRating: tourPackage.averageRating,
      totalRatings: tourPackage.totalRatings,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('❌ Error fetching feedbacks:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;