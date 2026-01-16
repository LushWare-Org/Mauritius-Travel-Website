// components/tour-detail/TourPackageTabs.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import StarRating from '../StarRating';
import API from '../../utils/api';

const TourPackageTabs = ({ pkg }) => {
  if (!pkg) return null;

  const [activeTab, setActiveTab] = useState('description');
  const [feedbacks, setFeedbacks] = useState([]);
  const [averageRating, setAverageRating] = useState(pkg.averageRating || 0);
  const [totalRatings, setTotalRatings] = useState(pkg.totalRatings || 0);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch feedbacks when reviews tab is active
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchFeedbacks();
    }
  }, [activeTab, pkg._id]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      // Use the API instance from utils/api.js
      const response = await API.get(`/feedback/package/${pkg._id}`, {
        params: { page: 1, limit: 10 },
      });

      if (response.data.success) {
        setFeedbacks(response.data.feedbacks);
        setAverageRating(response.data.averageRating);
        setTotalRatings(response.data.totalRatings);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('Submitting feedback for package:', pkg._id);

      const response = await API.post(`/feedback/${pkg._id}`, {
        rating,
        comment,
      });

      console.log('Feedback response:', response.data);

      if (response.data.success) {
        setRating(0);
        setComment('');
        fetchFeedbacks(); // Refresh feedbacks
        setError('');
        alert('Thank you for your review!');
      }
    } catch (err) {
      console.error('Detailed error:', err);

      if (err.response) {
        setError(
          err.response.data?.error ||
            err.response.data?.message ||
            `Server error: ${err.response.status}`
        );
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        size={16}
        color={index < rating ? '#ffc107' : '#e4e5e9'}
      />
    ));
  };

  // Inclusions & exclusions from the package data or defaults
  const inclusions =
    pkg.included && pkg.included.length > 0 ? pkg.included : ['Guided tours'];

  const exclusions =
    pkg.notIncluded && pkg.notIncluded.length > 0
      ? pkg.notIncluded
      : ['Optional activities'];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
      {/* Tabs Navigation - ADD REVIEWS TAB */}
      <div className="flex border-b overflow-x-auto">
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === 'description'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === 'itinerary'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('itinerary')}
        >
          Destinations
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === 'inclusions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('inclusions')}
        >
          Inclusions
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === 'exclusions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('exclusions')}
        >
          Exclusions
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({totalRatings})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'description' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">
              About This Tour
            </h3>
            <p className="text-gray-700 leading-relaxed">{pkg.description}</p>
          </div>
        )}

        {activeTab === 'inclusions' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">
              What's Included
            </h3>
            <ul className="space-y-2">
              {inclusions.map((item, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'exclusions' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">
              What's Not Included
            </h3>
            <ul className="space-y-2">
              {exclusions.map((item, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'itinerary' &&
          pkg.itinerary &&
          pkg.itinerary.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Tour Itinerary
              </h3>
              <div className="space-y-4">
                {pkg.itinerary.map((day, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{day}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Average Rating Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Customer Reviews
                  </h3>
                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <span className="ml-2 text-3xl font-bold">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="ml-2 text-gray-600">
                      ({totalRatings} ratings)
                    </span>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = feedbacks.filter(
                      (f) => f.rating === star
                    ).length;
                    const percentage =
                      totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center">
                        <span className="w-10 text-sm text-gray-600">
                          {star} star
                        </span>
                        <div className="w-32 h-2 bg-gray-200 rounded-full ml-2">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-gray-500 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Feedback Form */}
            <div className="bg-white border rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">
                Share Your Experience
              </h4>
              <form onSubmit={handleSubmitFeedback}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Your Rating:
                  </label>
                  <div className="flex">
                    {[...Array(5)].map((_, index) => {
                      const currentRating = index + 1;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setRating(currentRating)}
                          className="focus:outline-none"
                        >
                          <FaStar
                            className="cursor-pointer"
                            size={28}
                            color={
                              currentRating <= rating ? '#ffc107' : '#e4e5e9'
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Your Review:
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Share your experience with this tour package..."
                    maxLength="500"
                    required
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {comment.length}/500 characters
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 w-full md:w-auto"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Feedback List */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Customer Reviews ({feedbacks.length})
              </h4>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reviews...</p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FaUserCircle className="mx-auto text-gray-300 text-5xl mb-4" />
                  <p className="text-gray-500">
                    No reviews yet. Be the first to share your experience!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {feedbacks.map((feedback) => (
                    <div
                      key={feedback._id}
                      className="border-b pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <FaUserCircle size={32} className="text-gray-400" />
                          <div className="ml-3">
                            <p className="font-semibold">
                              {feedback.userId?.name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {renderStars(feedback.rating)}
                        </div>
                      </div>
                      <p className="text-gray-700">{feedback.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourPackageTabs;
