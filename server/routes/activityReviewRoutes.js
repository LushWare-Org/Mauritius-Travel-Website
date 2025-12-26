// backend/routes/activityReviewRoutes.js
const express = require('express');
const router = express.Router();
const {
    getReviewsByActivity,      
    getSummary,                
    createReview,             
    getUserReview,             
    canReview,                
    like,                     
    deleteReview,              
    getAllForModeration,       
    updateStatus,           
    reply,                     
    getStats,                 
    adminDelete,               
    getById                    
} = require('../controllers/activityReviewController');
const { protect, authorize } = require('../middleware/auth');

// Test route to check if API is working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Activity Reviews API is working!',
        timestamp: new Date().toISOString(),
        routes: [
            'GET /activity/:activityId',
            'GET /activity/:activityId/summary',
            'POST /activity/:activityId',
            'GET /activity/:activityId/user/my-review',
            'GET /activity/:activityId/can-review',
            'POST /:reviewId/like',
            'DELETE /:reviewId'
        ]
    });
});

// Public routes
router.get('/activity/:activityId', getReviewsByActivity);          // Updated
router.get('/activity/:activityId/summary', getSummary);            // Updated
router.get('/:id', getById);                                        // Added

// Protected routes (users)
router.post('/activity/:activityId', protect, createReview);        // Updated
router.get('/activity/:activityId/user/my-review', protect, getUserReview);  // Updated
router.get('/activity/:activityId/can-review', protect, canReview); // Updated
router.post('/:reviewId/like', protect, like);                      // Updated
router.delete('/:reviewId', protect, deleteReview);                 // Updated

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllForModeration);  // Updated
router.put('/admin/:reviewId/status', protect, authorize('admin'), updateStatus);  // Updated
router.post('/admin/:reviewId/reply', protect, authorize('admin'), reply);   // Updated
router.get('/admin/stats', protect, authorize('admin'), getStats);           // Updated
router.delete('/admin/:reviewId', protect, authorize('admin'), adminDelete); // Updated

// ADMIN: Create empty collection route
router.post('/admin/create-collection', protect, authorize('admin'), async (req, res) => {
    try {
        const ActivityReview = require('../models/ActivityReview');
        const mongoose = require('mongoose');
        
        console.log('📁 [ADMIN] Creating ActivityReview collection...');
        
        // Check if collection already exists
        const collectionExists = await mongoose.connection.db.listCollections({ 
            name: 'activityreviews' 
        }).hasNext();
        
        if (collectionExists) {
            const collection = mongoose.connection.db.collection('activityreviews');
            const stats = await collection.stats();
            const count = await ActivityReview.countDocuments();
            
            return res.json({
                success: true,
                message: 'ActivityReview collection already exists',
                collection: {
                    name: 'activityreviews',
                    exists: true,
                    documentCount: count,
                    size: stats.size,
                    storageSize: stats.storageSize
                }
            });
        }
        
        // Create empty collection
        await mongoose.connection.db.createCollection('activityreviews');
        console.log('✅ Empty collection created: activityreviews');
        
        // Create indexes using the model
        await ActivityReview.createIndexes();
        console.log('🔧 Indexes created');
        
        // Get final stats
        const collection = mongoose.connection.db.collection('activityreviews');
        const stats = await collection.stats();
        
        res.json({
            success: true,
            message: 'Empty ActivityReview collection created successfully',
            collection: {
                name: 'activityreviews',
                created: true,
                documentCount: 0,
                size: stats.size,
                storageSize: stats.storageSize,
                indexes: await collection.indexes()
            }
        });
        
        console.log('🎉 ActivityReview collection setup complete!');
        
    } catch (error) {
        console.error('❌ Error creating collection:', error);
        
        let errorMessage = error.message;
        if (error.code === 48) {
            errorMessage = 'Collection already exists';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            code: error.code
        });
    }
});

module.exports = router;