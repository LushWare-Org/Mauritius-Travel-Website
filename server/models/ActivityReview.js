// backend/models/ActivityReview.js
const mongoose = require('mongoose');

const activityReviewSchema = new mongoose.Schema({
    activity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    adminReply: {
        type: String,
        trim: true
    },
    adminReplyDate: {
        type: Date
    }
}, {
    timestamps: true
});

// REMOVE or change to non-unique:
// activityReviewSchema.index({ activity: 1, user: 1 }); // <-- REMOVE THIS

// Keep other indexes:
activityReviewSchema.index({ activity: 1, createdAt: -1 });
activityReviewSchema.index({ status: 1 });

// Static method to get average rating
activityReviewSchema.statics.getAverageRating = async function(activityId) {
    const result = await this.aggregate([
        {
            $match: { 
                activity: mongoose.Types.ObjectId.createFromHexString(activityId),
                status: 'approved' 
            }
        },
        {
            $group: {
                _id: '$activity',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingBreakdown: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length > 0) {
        const ratings = result[0].ratingBreakdown;
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(rating => breakdown[rating]++);
        
        return {
            averageRating: parseFloat(result[0].averageRating.toFixed(1)),
            totalReviews: result[0].totalReviews,
            ratingBreakdown: breakdown
        };
    }

    return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
};

module.exports = mongoose.model('ActivityReview', activityReviewSchema);