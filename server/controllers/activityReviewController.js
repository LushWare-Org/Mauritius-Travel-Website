// backend/controllers/activityReviewController.js
const ActivityReview = require('../models/ActivityReview');
const Activity = require('../models/Activity');

// @desc    Get all reviews for an activity
// @route   GET /api/v1/activity-reviews/activity/:activityId
// @access  Public
exports.getReviewsByActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { page = 1, limit = 10, sort = 'recent', userOnly = false } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Build sort object
        let sortQuery = { createdAt: -1 };
        if (sort === 'highest') sortQuery = { rating: -1, createdAt: -1 };
        if (sort === 'lowest') sortQuery = { rating: 1, createdAt: -1 };
        if (sort === 'helpful') sortQuery = { helpfulCount: -1, createdAt: -1 };
        
        // Check if activity exists
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ 
                success: false, 
                message: 'Activity not found' 
            });
        }
        
        // Build query
        const query = { 
            activity: activityId, 
            status: 'approved' 
        };
        
        // If userOnly is true and user is logged in, get only their reviews
        if (userOnly === 'true' && req.user) {
            query.user = req.user.id;
        }
        
        const reviews = await ActivityReview.find(query)
        .populate('user', 'name email avatar')
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit));
        
        const total = await ActivityReview.countDocuments(query);
        
        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get activity reviews error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Get review summary for an activity
// @route   GET /api/v1/activity-reviews/activity/:activityId/summary
// @access  Public
exports.getSummary = async (req, res) => {
    try {
        const { activityId } = req.params;
        
        // Check if activity exists
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ 
                success: false, 
                message: 'Activity not found' 
            });
        }
        
        const summary = await ActivityReview.getAverageRating(activityId);
        
        res.json({
            success: true,
            ...summary
        });
    } catch (error) {
        console.error('Get review summary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Create a review for an activity (ALLOW MULTIPLE REVIEWS)
// @route   POST /api/v1/activity-reviews/activity/:activityId
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { rating, comment, title } = req.body;
        
        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating must be between 1 and 5' 
            });
        }
        
        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Comment is required' 
            });
        }
        
        // Check if activity exists
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ 
                success: false, 
                message: 'Activity not found' 
            });
        }
        
        // Create review (ALLOW MULTIPLE - NO EXISTING REVIEW CHECK)
        const review = new ActivityReview({
            activity: activityId,
            user: req.user.id,
            rating,
            comment: comment.trim(),
            title: title ? title.trim() : undefined,
            status: 'approved' // Change to 'pending' for moderation
        });
        
        await review.save();
        
        // Populate user info
        await review.populate('user', 'name email avatar');
        
        res.status(201).json({
            success: true,
            data: review,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        console.error('Create review error:', error);
        
        // Check for duplicate key error (in case the unique index still exists in DB)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reviewed this activity. Please edit your existing review instead.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Get user's review(s) for an activity (can return multiple)
// @route   GET /api/v1/activity-reviews/activity/:activityId/user/my-review
// @access  Private
exports.getUserReview = async (req, res) => {
    try {
        const { activityId } = req.params;
        
        // Get ALL user reviews for this activity (not just one)
        const reviews = await ActivityReview.find({ 
            activity: activityId, 
            user: req.user.id 
        })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 }); // Get most recent first
        
        res.json({
            success: true,
            data: reviews,
            hasReviewed: reviews.length > 0,
            reviewCount: reviews.length
        });
    } catch (error) {
        console.error('Get user review error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Check if user can review an activity (ALWAYS TRUE FOR LOGGED IN USERS)
// @route   GET /api/v1/activity-reviews/activity/:activityId/can-review
// @access  Private
exports.canReview = async (req, res) => {
    try {
        const { activityId } = req.params;
        
        console.log('🔍 Checking if user can review activity:', {
            userId: req.user.id,
            activityId,
            userEmail: req.user.email
        });
        
        // Check if activity exists
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ 
                success: false, 
                message: 'Activity not found' 
            });
        }
        
        // Check how many reviews user already has
        const existingReviews = await ActivityReview.find({ 
            activity: activityId, 
            user: req.user.id 
        });
        
        console.log('📝 User has existing reviews:', existingReviews.length);
        
        // ALWAYS ALLOW REVIEWS FOR LOGGED IN USERS (multiple reviews allowed)
        const canReview = true;
        
        console.log('✅ User can review:', canReview);
        
        res.json({
            success: true,
            canReview: canReview,
            hasReviewed: existingReviews.length > 0,
            existingReviewsCount: existingReviews.length,
            message: existingReviews.length > 0 
                ? `You have ${existingReviews.length} review${existingReviews.length !== 1 ? 's' : ''} for this activity. You can submit another review.`
                : 'You can review this activity'
        });
    } catch (error) {
        console.error('Check review eligibility error:', error);
        res.status(500).json({ 
            success: false,
            canReview: false,
            message: 'Server error'
        });
    }
};

// @desc    Like/unlike a review
// @route   POST /api/v1/activity-reviews/:reviewId/like
// @access  Private
exports.like = async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await ActivityReview.findById(reviewId);
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }
        
        // Check if user already liked
        const alreadyLiked = review.likes.includes(req.user.id);
        
        if (alreadyLiked) {
            // Unlike
            review.likes.pull(req.user.id);
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
            // Like
            review.likes.push(req.user.id);
            review.helpfulCount += 1;
        }
        
        await review.save();
        
        res.json({
            success: true,
            data: {
                likes: review.likes.length,
                helpfulCount: review.helpfulCount,
                liked: !alreadyLiked
            }
        });
    } catch (error) {
        console.error('Like review error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Delete user's review
// @route   DELETE /api/v1/activity-reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await ActivityReview.findOneAndDelete({
            _id: reviewId,
            user: req.user.id
        });
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found or you are not authorized' 
            });
        }
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// ADMIN CONTROLLERS

// @desc    Get all activity reviews for moderation (admin)
// @route   GET /api/v1/activity-reviews/admin/all
// @access  Private/Admin
exports.getAllForModeration = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const reviews = await ActivityReview.find(query)
            .populate('user', 'name email')
            .populate('activity', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await ActivityReview.countDocuments(query);
        
        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Update review status (admin)
// @route   PUT /api/v1/activity-reviews/admin/:reviewId/status
// @access  Private/Admin
exports.updateStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }
        
        const review = await ActivityReview.findByIdAndUpdate(
            reviewId,
            { status },
            { new: true }
        ).populate('user', 'name email').populate('activity', 'name');
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }
        
        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Update review status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Reply to a review (admin)
// @route   POST /api/v1/activity-reviews/admin/:reviewId/reply
// @access  Private/Admin
exports.reply = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { replyMessage } = req.body;
        
        if (!replyMessage || replyMessage.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reply message is required' 
            });
        }
        
        const review = await ActivityReview.findByIdAndUpdate(
            reviewId,
            { 
                adminReply: replyMessage.trim(),
                adminReplyDate: new Date()
            },
            { new: true }
        ).populate('user', 'name email').populate('activity', 'name');
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }
        
        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Reply to review error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Get activity review statistics
// @route   GET /api/v1/activity-reviews/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
    try {
        const totalReviews = await ActivityReview.countDocuments();
        const pendingReviews = await ActivityReview.countDocuments({ status: 'pending' });
        const approvedReviews = await ActivityReview.countDocuments({ status: 'approved' });
        const rejectedReviews = await ActivityReview.countDocuments({ status: 'rejected' });
        
        // Get today's reviews
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayReviews = await ActivityReview.countDocuments({
            createdAt: { $gte: today }
        });
        
        // Get this week's reviews
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyReviews = await ActivityReview.countDocuments({
            createdAt: { $gte: oneWeekAgo }
        });
        
        res.json({
            success: true,
            data: {
                totalReviews,
                pendingReviews,
                approvedReviews,
                rejectedReviews,
                todayReviews,
                weeklyReviews,
                approvalRate: totalReviews > 0 ? ((approvedReviews / totalReviews) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Delete review (admin)
// @route   DELETE /api/v1/activity-reviews/admin/:reviewId
// @access  Private/Admin
exports.adminDelete = async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await ActivityReview.findByIdAndDelete(reviewId);
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Admin delete review error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// @desc    Get single review by ID
// @route   GET /api/v1/activity-reviews/:id
// @access  Public
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const review = await ActivityReview.findById(id)
            .populate('user', 'name email avatar')
            .populate('activity', 'name description location');
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }
        
        res.json({
            success: true,
            data: review
        });
    } catch (error) {
        console.error('Get review by ID error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};