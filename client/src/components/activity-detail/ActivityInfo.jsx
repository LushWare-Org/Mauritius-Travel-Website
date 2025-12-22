import React, { useState, useEffect } from 'react';
import { activityReviewsAPI } from '../../utils/api';
import { FaStar, FaRegStar, FaMapMarkerAlt } from 'react-icons/fa';

const ActivityInfo = ({ activity, currency = 'MUR' }) => {
    const [selectedDuration, setSelectedDuration] = useState('halfDay');
    const [reviewStats, setReviewStats] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(true);
    
    // Get currency symbol
    const getCurrencySymbol = () => {
        return currency === 'EUR' ? '€' : 'Rs';
    };

    // Fetch review statistics
    useEffect(() => {
        const fetchReviewStats = async () => {
            try {
                const response = await activityReviewsAPI.getSummary(activity._id);
                setReviewStats(response.data);
            } catch (error) {
                console.error('Error fetching review stats:', error);
                // Set default stats if API fails
                setReviewStats({
                    averageRating: activity.rating || 0,
                    totalReviews: 0,
                    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                });
            } finally {
                setLoadingReviews(false);
            }
        };
        
        fetchReviewStats();
    }, [activity._id]);

    // Determine current price based on selection
    const getCurrentPrice = () => {
        if (activity.pricingType === 'half-full-day') {
            return selectedDuration === 'halfDay' 
                ? (activity.halfDayPrice || activity.price)
                : (activity.fullDayPrice || activity.price);
        }
        return activity.price;
    };
    
    const getCurrentDuration = () => {
        if (activity.pricingType === 'half-full-day') {
            return selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day';
        }
        return activity.duration;
    };

    // Function to render stars
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    star <= fullStars ? 
                        <FaStar key={star} className="w-5 h-5 text-yellow-400" /> : 
                        (star === fullStars + 1 && hasHalfStar) ?
                        <div key={star} className="relative w-5 h-5">
                            <FaRegStar className="absolute w-5 h-5 text-gray-300" />
                            <div className="absolute overflow-hidden w-2.5 h-5">
                                <FaStar className="w-5 h-5 text-yellow-400" />
                            </div>
                        </div> :
                        <FaRegStar key={star} className="w-5 h-5 text-gray-300" />
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{activity.title}</h1>
                    
                    {/* Rating with Real Data */}
                    <div className="flex items-center mb-4">
                        {loadingReviews ? (
                            <div className="flex items-center">
                                <div className="animate-pulse flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                                <div className="ml-2 w-20 h-5 bg-gray-200 rounded"></div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center mr-4">
                                    {renderStars(reviewStats.averageRating)}
                                    <span className="ml-2 text-xl font-bold text-gray-800">
                                        {reviewStats.averageRating.toFixed(1)}
                                    </span>
                                </div>
                                <div className="text-gray-600">
                                    ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''})
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-gray-600">
                        <FaMapMarkerAlt className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="text-lg">{activity.location}</span>
                    </div>
                </div>
                
                {/* Pricing Info */}
                <div className="mt-4 md:mt-0 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    {/* Duration Selection for Half/Full Day */}
                    {activity.pricingType === 'half-full-day' ? (
                        <div className="mb-4">
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                                        selectedDuration === 'halfDay'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                    }`}
                                    onClick={() => setSelectedDuration('halfDay')}
                                >
                                    <div className="font-semibold">Half Day</div>
                                    <div className="text-sm mt-1 font-bold">
                                        {getCurrencySymbol()}{activity.halfDayPrice || activity.price}
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                                        selectedDuration === 'fullDay'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                    }`}
                                    onClick={() => setSelectedDuration('fullDay')}
                                >
                                    <div className="font-semibold">Full Day</div>
                                    <div className="text-sm mt-1 font-bold">
                                        {getCurrencySymbol()}{activity.fullDayPrice || activity.price}
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : null}
                    
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Price:</span>
                            <span className="text-2xl font-bold text-blue-600">
                                {getCurrencySymbol()}{getCurrentPrice()}
                                <span className="text-sm font-normal text-gray-500 ml-1">per package</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-semibold">
                                {activity.pricingType === 'half-full-day' 
                                    ? getCurrentDuration() 
                                    : `${activity.duration} hour${activity.duration !== 1 ? 's' : ''}`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Activity Type:</span>
                            <span className="font-semibold capitalize">
                                {activity.type.replace('-', ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityInfo;