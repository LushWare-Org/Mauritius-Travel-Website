// src/pages/admin/activity/ActivityReviewDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { activityReviewsAPI } from '../../../../utils/api';
import AdminLayout from '../../../../components/admin/AdminLayout';
import {
  FaStar,
  FaArrowLeft,
  FaTrash,
  FaCalendar,
  FaUser,
  FaTag,
} from 'react-icons/fa';

const ActivityReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview();
  }, [id]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await activityReviewsAPI.getAllForModeration();
      if (response.data.success) {
        const foundReview = response.data.data.find((r) => r._id === id);
        if (foundReview) {
          setReview(foundReview);
        } else {
          throw new Error('Review not found');
        }
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      navigate('/admin/activity-reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await activityReviewsAPI.adminDelete(id);
      navigate('/admin/activity-reviews');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">Review Not Found</h3>
          <p className="text-gray-600 mb-4">
            The review you're looking for doesn't exist.
          </p>
          <Link
            to="/admin/activity-reviews"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" /> Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/activity-reviews')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Review Details
              </h1>
              <p className="text-gray-500">
                View and manage this customer review
              </p>
            </div>
          </div>

          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          >
            <FaTrash className="mr-2" /> Delete Review
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Review Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800">
                      {review.rating}.0
                    </div>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        review.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : review.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <FaTag className="w-3 h-3 mr-1" />
                      {review.status.charAt(0).toUpperCase() +
                        review.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {review.title && (
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {review.title}
                </h2>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>

            {/* Activity Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Activity Details
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">
                    <Link
                      to={`/admin/activities/view/${
                        review.activity?._id || review.activity
                      }`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {review.activity?.name || 'Unknown Activity'}
                    </Link>
                  </h4>
                  {review.activity?.description && (
                    <p className="text-gray-600 text-sm mt-2">
                      {review.activity.description.substring(0, 150)}...
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-gray-600">
                    <FaCalendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Reviewed on</div>
                      <div className="text-sm">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {review.bookingDate && (
                    <div className="flex items-center text-gray-600">
                      <FaCalendar className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">
                          Activity Date
                        </div>
                        <div className="text-sm">
                          {new Date(review.bookingDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Customer</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <FaUser className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {review.user?.name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {review.user?.email || 'No email provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                System Info
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Review ID</div>
                  <div className="text-sm font-mono text-gray-700 truncate">
                    {review._id}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div className="text-sm text-gray-700">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivityReviewDetail;
