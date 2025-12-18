import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityReviewsAPI } from '../../utils/api';
import StarRating from '../StarRating';
import ActivityReviewForm from '../ActivityReviewForm';
import { FaStar, FaUserCircle } from 'react-icons/fa';

const ActivityTabs = ({ activity }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [userReviews, setUserReviews] = useState([]); // Changed to array for multiple reviews
  const [canReview, setCanReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!token && !!user);
  }, []);

  // Fetch reviews data
  useEffect(() => {
    if (activeTab === 'reviews' && activity?._id) {
      fetchReviewsData();
    }
  }, [activeTab, activity?._id]);

  const fetchReviewsData = async () => {
    setLoadingReviews(true);
    try {
      console.log('🔍 Fetching reviews for activity:', activity._id);

      const [summaryRes, reviewsRes, userReviewsRes, canReviewRes] =
        await Promise.allSettled([
          activityReviewsAPI.getSummary(activity._id),
          activityReviewsAPI.getByActivityId(activity._id, {
            page: 1,
            limit: 5,
            status: 'approved',
          }),
          activityReviewsAPI.getByActivityId(activity._id, {
            page: 1,
            limit: 50, // Get more reviews for the current user
            userOnly: true,
          }),
          activityReviewsAPI.canReview(activity._id),
        ]);

      console.log('API Responses:', {
        summary: summaryRes,
        reviews: reviewsRes,
        userReviews: userReviewsRes,
        canReview: canReviewRes,
      });

      // Process summary
      if (summaryRes.status === 'fulfilled' && summaryRes.value.data) {
        const summaryData = summaryRes.value.data;
        console.log('Summary data:', summaryData);

        // Check if summary data is in data property or directly
        if (summaryData.data) {
          setReviewSummary(summaryData.data);
        } else if (summaryData.success !== false) {
          setReviewSummary(summaryData);
        }
      }

      // Process all reviews
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data) {
        const reviewsData = reviewsRes.value.data;
        if (reviewsData.success !== false) {
          setReviews(reviewsData.data || []);
        }
      }

      // Process user reviews (multiple)
      if (userReviewsRes.status === 'fulfilled') {
        const userReviewsData = userReviewsRes.value.data;
        if (userReviewsData && userReviewsData.success) {
          setUserReviews(userReviewsData.data || []);
        } else {
          setUserReviews([]);
        }
      }

      // Process can review - allow multiple reviews
      if (canReviewRes.status === 'fulfilled') {
        const canReviewData = canReviewRes.value.data;
        console.log('Can review data:', canReviewData);
        // Always allow review for logged in users (multiple reviews allowed)
        setCanReview(isLoggedIn);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // On error, allow review for logged in users
      setCanReview(isLoggedIn);
      setUserReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleReviewSubmit = async () => {
    setShowReviewForm(false);
    fetchReviewsData(); // Refresh reviews
  };

  const getRatingPercentage = (star) => {
    if (!reviewSummary?.ratingBreakdown || !reviewSummary.totalReviews)
      return 0;
    const count = reviewSummary.ratingBreakdown[star] || 0;
    return Math.round((count / reviewSummary.totalReviews) * 100);
  };

  const renderRatingBreakdown = () => {
    if (!reviewSummary) return null;

    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Rating Breakdown
        </h4>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center">
              <div className="flex items-center w-16">
                <span className="text-sm font-medium mr-2">{star}</span>
                <FaStar className="text-yellow-400" />
              </div>
              <div className="flex-1 ml-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                    style={{ width: `${getRatingPercentage(star)}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 w-8 text-right text-sm text-gray-600">
                {getRatingPercentage(star)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'description', label: 'Description', icon: '📝' },
    { id: 'inclusions', label: "What's Included", icon: '✅' },
    { id: 'exclusions', label: "What's Not Included", icon: '❌' },
    { id: 'requirements', label: 'Requirements', icon: '📋' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
  ];

  const inclusions =
    activity.included && activity.included.length > 0
      ? activity.included
      : [
          'Professional English-speaking guide',
          'Hotel pickup and drop-off',
          'All equipment needed for the activity',
          'Safety briefing',
          'Refreshments',
          'Insurance coverage',
        ];

  const exclusions =
    activity.notIncluded && activity.notIncluded.length > 0
      ? activity.notIncluded
      : [
          'Personal expenses',
          'Gratuities (optional)',
          'Meals not specified',
          'Alcoholic beverages',
          'Additional activities not mentioned',
          'Souvenirs and personal shopping',
        ];

  const requirements =
    activity.requirements && activity.requirements.length > 0
      ? activity.requirements
      : [
          'Good physical condition',
          'Swimwear and towel',
          'Sunscreen and sunglasses',
          'Comfortable clothing',
          'Valid ID/passport',
          'Minimum age: 12 years',
        ];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 min-w-0 flex items-center justify-center px-4 py-4 text-sm font-medium transition-all duration-300 group ${
              activeTab === tab.id
                ? 'text-blue-700 bg-white shadow-sm border-t border-x border-gray-200 rounded-t-lg'
                : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
            }`}
          >
            <span className="mr-2 text-lg">{tab.icon}</span>
            <span className="whitespace-nowrap">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            )}
            <div
              className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full ${
                activeTab === tab.id ? 'w-full' : ''
              }`}
            ></div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4">
                <span className="text-xl">📝</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Excursion Details
              </h3>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                {activity.description}
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                This {activity.duration}-hour {activity.type.replace('-', ' ')}{' '}
                experience is designed to immerse you in the natural beauty of
                Mauritius. Our expert guides will ensure every moment is filled
                with wonder and excitement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {activity.duration} hours
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-100">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-cyan-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">
                      {activity.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Group Size</p>
                    <p className="font-semibold text-gray-900">Small groups</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inclusions Tab */}
        {activeTab === 'inclusions' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4">
                <span className="text-xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                What's Included
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inclusions.map((item, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-100 hover:border-green-300 transition-all duration-300"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 group-hover:text-green-700 transition-colors">
                        {item}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2">Value Added</h4>
              <p className="text-gray-700">
                Everything you need for a seamless and enjoyable experience is
                included. Our goal is to provide worry-free adventures where you
                can focus on creating memories.
              </p>
            </div>
          </div>
        )}

        {/* Exclusions Tab */}
        {activeTab === 'exclusions' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center mr-4">
                <span className="text-xl">❌</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                What's Not Included
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exclusions.map((item, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-red-50 to-white rounded-xl p-5 border border-red-100 hover:border-red-300 transition-all duration-300"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 group-hover:text-red-700 transition-colors">
                        {item}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-2">Pro Tips</h4>
              <p className="text-gray-700">
                We recommend bringing some cash for personal purchases and
                gratuities. 
              </p>
            </div>
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-xl flex items-center justify-center mr-4">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Requirements & Preparation
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((item, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 group-hover:text-blue-700 transition-colors">
                        {item}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                Health & Safety
              </h4>
              <p className="text-gray-700">
              Please inform us of any medical conditions or concerns in advance for
                your safety.
              </p>
            </div>
          </div>
        )}
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Review Header with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mr-4">
                    <FaStar className="text-yellow-500 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Customer Reviews
                    </h3>
                    <p className="text-gray-600">
                      See what other travelers are saying
                    </p>
                  </div>
                </div>

                {reviewSummary && (
                  <div className="flex flex-col md:flex-row items-start md:items-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100 gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900">
                        {reviewSummary.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex justify-center mt-2">
                        {reviewSummary.averageRating ? (
                          <StarRating
                            rating={reviewSummary.averageRating}
                            size={20}
                            editable={false}
                          />
                        ) : (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className="text-gray-300" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600 mt-2">
                        {reviewSummary.totalReviews || 0} review
                        {reviewSummary.totalReviews !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex-1">{renderRatingBreakdown()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Section - Write Review Button & User Reviews */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Write Review Button Section */}
                <div className="md:w-2/3">
                  {!isLoggedIn ? (
                    <div className="text-center md:text-left">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Want to share your experience?
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Login to write a review and help other travelers make
                        informed decisions.
                      </p>
                      <Link
                        to="/login"
                        state={{ from: `/activities/${activity._id}` }}
                        className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium group shadow-lg hover:shadow-xl"
                      >
                        <FaStar className="mr-2" />
                        Login to Write a Review
                        <svg
                          className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 5l7 7-7 7M5 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center md:text-left">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {userReviews.length > 0
                          ? `You have ${userReviews.length} review${
                              userReviews.length !== 1 ? 's' : ''
                            } for this activity`
                          : 'Share your experience with this activity'}
                      </h4>
                      <p className="text-gray-600 mb-4">
                        {userReviews.length > 0
                          ? 'Add another review to share more about your experience.'
                          : 'Your review helps other travelers make informed decisions.'}
                      </p>
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 font-medium group shadow-lg hover:shadow-xl"
                      >
                        <FaStar className="mr-2" />
                        {userReviews.length > 0
                          ? 'Write Another Review'
                          : 'Write a Review'}
                        <svg
                          className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 5l7 7-7 7M5 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* User's Existing Reviews (if any) */}
                {userReviews.length > 0 && (
                  <div className="md:w-1/3">
                    <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <FaStar className="mr-2 text-yellow-500" />
                        All Reviews
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {userReviews.length}
                        </span>
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {userReviews.slice(0, 3).map((review, index) => (
                          <div
                            key={review._id || index}
                            className="pb-2 border-b border-blue-50 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar
                                      key={i}
                                      className={
                                        i < review.rating
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }
                                      size={10}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                            </div>
                            <p className="text-gray-700 text-xs line-clamp-1 mt-1">
                              {review.comment}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                        {userReviews.length > 3 && (
                          <p className="text-blue-600 text-xs text-center mt-2">
                            + {userReviews.length - 3} more review
                            {userReviews.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Review Form Modal */}
            {showReviewForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Write Your Review</h2>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="p-4">
                    <ActivityReviewForm
                      activityId={activity._id}
                      onSuccess={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                      allowMultiple={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-semibold text-gray-900">
                  Recent Reviews
                </h4>
                {reviewSummary?.totalReviews > 5 && (
                  <Link
                    to={`/activity-reviews/${activity._id}`}
                    state={{ activityName: activity.name }}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View all {reviewSummary.totalReviews} reviews
                    <svg
                      className="ml-1 w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                )}
              </div>

              {loadingReviews ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <FaStar className="mx-auto text-gray-400 text-5xl mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Be the first to review this activity!
                  </p>
                  {isLoggedIn && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-medium"
                    >
                      Write the First Review
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:border-blue-200 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden mr-4">
                            {review.user?.profileImage ? (
                              <img
                                src={review.user.profileImage}
                                alt={review.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaUserCircle className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {review.user?.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 flex">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={
                                  i < review.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {review.title && (
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">
                          {review.title}
                        </h3>
                      )}

                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {review.comment}
                      </p>

                      {review.adminReply && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                          <div className="flex items-center mb-2">
                            <span className="font-semibold text-blue-700 mr-2">
                              Admin Response
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(
                                review.adminReplyDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.adminReply}</p>
                        </div>
                      )}
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

// Add this CSS animation
const style = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
}
`;

// Add the style to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}

export default ActivityTabs;
