import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityReviewsAPI } from '../../utils/api';
import { FaStar, FaRegStar } from 'react-icons/fa';

const ActivityListItem = ({ activity }) => {
    const [reviewStats, setReviewStats] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(true);

    // Handle undefined activity object
    if (!activity) {
        return null;
    }

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
                    totalReviews: 0
                });
            } finally {
                setLoadingReviews(false);
            }
        };
        
        fetchReviewStats();
    }, [activity._id]);

    // Function to render stars
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    star <= fullStars ? 
                        <FaStar key={star} className="w-3 h-3 text-yellow-400" /> : 
                        (star === fullStars + 1 && hasHalfStar) ?
                        <div key={star} className="relative w-3 h-3">
                            <FaRegStar className="absolute w-3 h-3 text-gray-300" />
                            <div className="absolute overflow-hidden w-1.5 h-3">
                                <FaStar className="w-3 h-3 text-yellow-400" />
                            </div>
                        </div> :
                        <FaRegStar key={star} className="w-3 h-3 text-gray-300" />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row hover:border-blue-200">
            {/* Activity Image */}
            <div className="sm:w-2/5 h-48 sm:h-auto relative">
                <img 
                    src={activity.image || '/images/placeholder.jpg'} 
                    alt={activity.title || 'Activity'}
                    className="w-full h-full object-cover"
                />
                {activity.featured && (
                    <span className="absolute top-3 left-0 bg-yellow-500 text-blue-900 py-1 px-3 font-semibold text-xs uppercase rounded-r">
                        Featured
                    </span>
                )}
            </div>
            
            {/* Activity Details */}
            <div className="p-5 flex flex-col flex-grow sm:w-3/5">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-800">{activity.title || 'Untitled Activity'}</h2>
                    
                    {/* Rating Section */}
                    <div className="flex flex-col items-end">
                        {loadingReviews ? (
                            <div className="flex items-center space-x-1 animate-pulse">
                                <div className="w-12 h-4 bg-gray-200 rounded"></div>
                            </div>
                        ) : reviewStats && reviewStats.totalReviews > 0 ? (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center">
                                    {renderStars(reviewStats.averageRating)}
                                    <span className="ml-1 font-bold text-gray-800">
                                        {reviewStats.averageRating.toFixed(1)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center">
                                    {renderStars(5.0)}
                                    <span className="ml-1 font-bold text-gray-800">5.0</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">(0 reviews)</div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Activity Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="bg-blue-50 text-blue-700 text-xs py-1 px-3 rounded-full border border-blue-100">
                        {activity.type || 'Unknown'}
                    </span>
                    <span className="bg-green-50 text-green-700 text-xs py-1 px-3 rounded-full border border-green-100">
                        {activity.duration || 0} hour{(activity.duration || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="bg-purple-50 text-purple-700 text-xs py-1 px-3 rounded-full border border-purple-100">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {activity.location || 'Location TBD'}
                    </span>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 my-4 line-clamp-2 text-sm">
                    {activity.description || activity.shortDescription || 'No description available'}
                </p>
                
                {/* Price and CTA */}
                <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-100">
                    <div>
                        <div className="text-blue-600 font-bold text-xl">
                            ${activity.price || 0}
                            <span className="text-gray-500 text-sm font-normal ml-1">per package</span>
                        </div>
                        {activity.pricingNote && (
                            <div className="text-xs text-gray-500 mt-1">
                                {activity.pricingNote}
                            </div>
                        )}
                    </div>
                    
                    <Link 
                        to={`/activities/${activity._id || activity.id}`}
                        className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm inline-flex items-center justify-center"
                    >
                        View Details
                        <i className="fas fa-arrow-right ml-2 text-sm"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ActivityListItem;