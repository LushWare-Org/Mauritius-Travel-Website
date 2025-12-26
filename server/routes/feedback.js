// routes/feedback.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const TourPackage = require('../models/TourPackage');
const { protect, authorize } = require('../middleware/auth'); // Import authorize middleware

// Add this as the FIRST route in routes/feedback.js
router.get('/test-admin', protect, authorize('admin'), (req, res) => {
  console.log(
    '✅ Test admin route hit by:',
    req.user.email,
    'role:',
    req.user.role
  );
  res.json({
    success: true,
    message: 'Admin feedback routes are working!',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});
// Submit feedback - PROTECTED ROUTE
router.post('/:packageId', protect, async (req, res) => {
  try {
    console.log('🔐 Feedback submission - User:', req.user.id);

    const { rating, comment } = req.body;
    const { packageId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid rating between 1 and 5',
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a comment',
      });
    }

    // Check if package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        error: 'Tour package not found',
      });
    }

    // Check if user already submitted feedback for this package
    const existingFeedback = await Feedback.findOne({
      packageId,
      userId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted feedback for this package',
      });
    }

    // Create feedback
    const feedback = new Feedback({
      packageId,
      userId,
      rating,
      comment,
    });

    await feedback.save();

    // Update package average rating
    const allFeedbacks = await Feedback.find({ packageId });

    const totalRatings = allFeedbacks.length;
    const averageRating =
      allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalRatings;

    tourPackage.averageRating = averageRating;
    tourPackage.totalRatings = totalRatings;
    await tourPackage.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
      averageRating,
      totalRatings,
    });
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(400).json({
      success: false,
      error: error.message,
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
        error: 'Tour package not found',
      });
    }

    const feedbacks = await Feedback.find({ packageId })
      .populate('userId', 'name email')
      .populate('packageId', 'title') // Populate package title
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
      currentPage: page,
    });
  } catch (error) {
    console.error('❌ Error fetching feedbacks:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ADMIN ROUTES
// ========================

// Get all feedbacks across all packages - ADMIN ONLY
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      packageId,
      userId,
      minRating,
      maxRating,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter object
    const filter = {};

    if (packageId) {
      filter.packageId = packageId;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseInt(minRating);
      if (maxRating) filter.rating.$lte = parseInt(maxRating);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get feedbacks with pagination and filtering
    const feedbacks = await Feedback.find(filter)
      .populate('userId', 'name email')
      .populate('packageId', 'title')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    // Get statistics
    const stats = await Feedback.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedbacks: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      feedbacks,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      stats: stats[0]
        ? {
            averageRating: stats[0].averageRating.toFixed(2),
            totalFeedbacks: stats[0].totalFeedbacks,
          }
        : null,
      filter,
    });
  } catch (error) {
    console.error('❌ Error fetching all feedbacks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get feedback statistics - ADMIN ONLY
router.get(
  '/admin/statistics',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const filter = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Get overall statistics
      const overallStats = await Feedback.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalFeedbacks: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            minRating: { $min: '$rating' },
            maxRating: { $max: '$rating' },
          },
        },
      ]);

      // Get rating distribution
      const ratingDistribution = await Feedback.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get feedbacks per package
      const packageStats = await Feedback.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$packageId',
            feedbackCount: { $sum: 1 },
            averageRating: { $avg: '$rating' },
          },
        },
        { $sort: { feedbackCount: -1 } },
        { $limit: 10 },
      ]);

      // Populate package names
      const populatedPackageStats = await Promise.all(
        packageStats.map(async (stat) => {
          const packageDetails = await TourPackage.findById(stat._id).select(
            'title'
          );
          return {
            ...stat,
            packageTitle: packageDetails
              ? packageDetails.title
              : 'Deleted Package',
          };
        })
      );

      // Get recent feedbacks (last 10)
      const recentFeedbacks = await Feedback.find(filter)
        .populate('userId', 'name email')
        .populate('packageId', 'title')
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        success: true,
        statistics: overallStats[0] || {
          totalFeedbacks: 0,
          averageRating: 0,
          minRating: 0,
          maxRating: 0,
        },
        ratingDistribution,
        topPackages: populatedPackageStats,
        recentFeedbacks,
      });
    } catch (error) {
      console.error('❌ Error fetching feedback statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get single feedback by ID - ADMIN ONLY
router.get('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('packageId', 'title description');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete feedback - ADMIN ONLY
router.delete('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
    }

    const packageId = feedback.packageId;

    // Delete the feedback
    await feedback.deleteOne();

    // Recalculate package ratings
    const allFeedbacks = await Feedback.find({ packageId });

    let averageRating = 0;
    let totalRatings = 0;

    if (allFeedbacks.length > 0) {
      totalRatings = allFeedbacks.length;
      averageRating =
        allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalRatings;
    }

    // Update package
    const tourPackage = await TourPackage.findById(packageId);
    if (tourPackage) {
      tourPackage.averageRating = averageRating;
      tourPackage.totalRatings = totalRatings;
      await tourPackage.save();
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
      deletedFeedback: feedback,
      updatedPackageStats: {
        averageRating,
        totalRatings,
      },
    });
  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Bulk delete feedbacks - ADMIN ONLY
router.delete(
  '/admin/bulk/delete',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { feedbackIds } = req.body;

      if (
        !feedbackIds ||
        !Array.isArray(feedbackIds) ||
        feedbackIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: 'Please provide an array of feedback IDs to delete',
        });
      }

      // Get all feedbacks to be deleted
      const feedbacksToDelete = await Feedback.find({
        _id: { $in: feedbackIds },
      });

      if (feedbacksToDelete.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No feedbacks found with the provided IDs',
        });
      }

      // Group feedbacks by package for recalculation
      const packagesToUpdate = {};
      feedbacksToDelete.forEach((feedback) => {
        const packageId = feedback.packageId.toString();
        if (!packagesToUpdate[packageId]) {
          packagesToUpdate[packageId] = [];
        }
        packagesToUpdate[packageId].push(feedback._id);
      });

      // Delete feedbacks
      const deleteResult = await Feedback.deleteMany({
        _id: { $in: feedbackIds },
      });

      // Recalculate ratings for each affected package
      const updateResults = [];
      for (const packageId of Object.keys(packagesToUpdate)) {
        const remainingFeedbacks = await Feedback.find({ packageId });

        let averageRating = 0;
        let totalRatings = 0;

        if (remainingFeedbacks.length > 0) {
          totalRatings = remainingFeedbacks.length;
          averageRating =
            remainingFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) /
            totalRatings;
        }

        const tourPackage = await TourPackage.findById(packageId);
        if (tourPackage) {
          tourPackage.averageRating = averageRating;
          tourPackage.totalRatings = totalRatings;
          await tourPackage.save();

          updateResults.push({
            packageId,
            packageTitle: tourPackage.title,
            averageRating,
            totalRatings,
          });
        }
      }

      res.json({
        success: true,
        message: `Successfully deleted ${deleteResult.deletedCount} feedback(s)`,
        deletedCount: deleteResult.deletedCount,
        updatedPackages: updateResults,
      });
    } catch (error) {
      console.error('❌ Error bulk deleting feedbacks:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get feedbacks for a specific user - ADMIN ONLY
router.get(
  '/admin/user/:userId',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const feedbacks = await Feedback.find({ userId })
        .populate('packageId', 'title')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Feedback.countDocuments({ userId });

      // Get user statistics
      const userStats = await Feedback.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalFeedbacks: { $sum: 1 },
            averageRating: { $avg: '$rating' },
          },
        },
      ]);

      res.json({
        success: true,
        feedbacks,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        userStats: userStats[0] || {
          totalFeedbacks: 0,
          averageRating: 0,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching user feedbacks:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;
