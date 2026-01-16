import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityReviewsAPI } from '../../utils/api';
import { FaStar, FaRegStar } from 'react-icons/fa';

const ActivityListItem = ({ activity, currency = 'EUR' }) => {
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
        // Set default stats if API fails - 0 stars and 0 reviews
        setReviewStats({
          averageRating: 0,
          totalReviews: 0,
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

    // If rating is 0, show all empty stars
    if (rating === 0) {
      return (
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaRegStar key={star} className="w-3 h-3 text-gray-300" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= fullStars ? (
            <FaStar key={star} className="w-3 h-3 text-yellow-400" />
          ) : star === fullStars + 1 && hasHalfStar ? (
            <div key={star} className="relative w-3 h-3">
              <FaRegStar className="absolute w-3 h-3 text-gray-300" />
              <div className="absolute overflow-hidden w-1.5 h-3">
                <FaStar className="w-3 h-3 text-yellow-400" />
              </div>
            </div>
          ) : (
            <FaRegStar key={star} className="w-3 h-3 text-gray-300" />
          )
        )}
      </div>
    );
  };

  // Get currency symbol 
  const getCurrencySymbol = (curr) => {
    const symbols = {
      EUR: '€',
      MUR: 'Rs',
    };
    return symbols[curr] || '€';
  };

  const symbol = getCurrencySymbol(currency);

  // Get display price (use halfDayPrice as default)
  const getDisplayPrice = () => {
    return activity.halfDayPrice || activity.price || 0;
  };

  // Format price with currency symbol
  const formatPrice = (price) => {
    return `${symbol}${price}`;
  };

  // Show pricing details
  const renderPricingDetails = () => {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Full Day:</span>
          <span className="font-semibold text-blue-700">
            {formatPrice(activity.fullDayPrice || getDisplayPrice())}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Half Day:</span>
          <span className="font-semibold text-green-700">
            {formatPrice(activity.halfDayPrice || getDisplayPrice())}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row hover:border-blue-200 group min-h-[250px] h-full">
      {/* Activity Image */}
      <div className="sm:w-1/3 relative flex-shrink-0">
        <div className="relative h-48 sm:h-full w-full overflow-hidden bg-gradient-to-br from-blue-50 to-gray-100">
          <img
            src={activity.image || '/images/placeholder.jpg'}
            alt={activity.title || 'Activity'}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=Activity+Image';
            }}
          />
          {activity.featured && (
            <span className="absolute top-3 left-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-1 px-3 font-semibold text-xs uppercase rounded-r shadow-md">
              Featured
            </span>
          )}
          {/* Currency Badge */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-1 px-3 font-semibold text-xs uppercase rounded-lg shadow-md">
            {currency} {symbol}
          </div>
        </div>
      </div>

      {/* Activity Details */}
      <div className="p-5 flex flex-col flex-grow sm:w-3/5 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-blue-800 group-hover:text-blue-700 transition-colors truncate">
              {activity.title || 'Untitled Activity'}
            </h2>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-500 truncate">
                <i className="fas fa-map-marker-alt mr-1"></i>
                {activity.location || 'Location TBD'}
              </span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="flex flex-col items-end flex-shrink-0 ml-2">
            {loadingReviews ? (
              <div className="flex items-center space-x-1 animate-pulse">
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
              </div>
            ) : reviewStats ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center">
                  {renderStars(reviewStats.averageRating || 0)}
                  <span className="ml-1 font-bold text-gray-800">
                    {(reviewStats.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {reviewStats.totalReviews || 0} review
                  {(reviewStats.totalReviews || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <div className="flex items-center">
                  {renderStars(0)}
                  <span className="ml-1 font-bold text-gray-800">0.0</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">(0 reviews)</div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="my-4 flex-grow min-h-[60px]">
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed h-full">
            {activity.description ||
              activity.shortDescription ||
              'No description available'}
          </p>
        </div>

        {/* Price and CTA */}
        <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-100">
          <div className="w-full sm:w-auto mb-3 sm:mb-0">
            {renderPricingDetails()}

            {activity.pricingNote && (
              <div className="text-xs text-gray-500 mt-1 italic">
                <i className="fas fa-sticky-note mr-1"></i>
                {activity.pricingNote}
              </div>
            )}
          </div>

          <Link
            to={`/activities/${
              activity._id || activity.id
            }?currency=${currency}`}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium text-sm inline-flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
          >
            View Details
            <i className="fas fa-arrow-right ml-2 text-sm group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivityListItem;