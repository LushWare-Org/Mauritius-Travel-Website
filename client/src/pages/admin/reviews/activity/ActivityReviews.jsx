// src/pages/admin/activity/ActivityReviews.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { activityReviewsAPI, activitiesAPI } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { FaStar, FaEye, FaTrash, FaUser, FaCalendar, FaSync, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

const AdminActivityReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [activityNames, setActivityNames] = useState({});
  const [fetchingNames, setFetchingNames] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const fetchActivityNames = useCallback(async (activityIds) => {
    try {
      setFetchingNames(true);
      const uniqueIds = [...new Set(activityIds.filter(id => id && !activityNames[id]))];
      
      if (uniqueIds.length === 0) return;
      
      const namesMap = { ...activityNames };
      
      for (const activityId of uniqueIds) {
        try {
          const response = await activitiesAPI.getById(activityId);
          if (response.data.success && response.data.data) {
            const activity = response.data.data;
            namesMap[activityId] = activity.name || activity.title || `Activity ${activityId.substring(0, 6)}...`;
          } else {
            namesMap[activityId] = `Activity (ID: ${activityId.substring(0, 6)}...)`;
          }
        } catch (error) {
          console.error(`Error fetching activity ${activityId}:`, error);
          namesMap[activityId] = `Activity (ID: ${activityId.substring(0, 6)}...)`;
        }
      }
      
      setActivityNames(namesMap);
    } catch (error) {
      console.error('Error fetching activity names:', error);
    } finally {
      setFetchingNames(false);
    }
  }, [activityNames]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      try {
        response = await activityReviewsAPI.getAllForModeration({
          page,
          limit: 10
        });
      } catch (modError) {
        console.warn('Admin moderation endpoint failed, trying getAllReviews...');
        
        response = await activityReviewsAPI.getAllReviews({
          page,
          limit: 10
        });
        
        if (response.data.success && response.data.data) {
          const allReviews = response.data.data;
          const pendingReviews = allReviews.filter(review => 
            review.status === 'pending' || !review.status || review.status === 'awaiting_moderation'
          );
          
          const startIndex = (page - 1) * 10;
          const endIndex = startIndex + 10;
          const paginatedReviews = pendingReviews.slice(startIndex, endIndex);
          
          response.data.data = paginatedReviews;
          response.data.pagination = {
            total: pendingReviews.length,
            page: page,
            limit: 10,
            pages: Math.ceil(pendingReviews.length / 10)
          };
        }
      }
      
      if (response.data.success) {
        let reviewsData = [];
        
        if (Array.isArray(response.data.data)) {
          reviewsData = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data.data)) {
          reviewsData = response.data.data.data;
        } else if (response.data.reviews && Array.isArray(response.data.reviews)) {
          reviewsData = response.data.reviews;
        }
        
        const processedReviews = reviewsData.map(review => ({
          ...review,
          _id: review._id || review.id || `temp_${Date.now()}_${Math.random()}`,
          rating: review.rating || 0,
          comment: review.comment || review.content || '',
          status: review.status || 'pending',
          createdAt: review.createdAt || review.date || new Date().toISOString(),
          user: review.user || { name: 'Anonymous' }
        }));
        
        setReviews(processedReviews);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalReviews(response.data.pagination?.total || processedReviews.length);
        
        const activityIds = processedReviews
          .map(review => {
            if (review.activity) {
              if (typeof review.activity === 'object') {
                return review.activity._id || review.activity.id || review.activity;
              }
              return review.activity;
            }
            return null;
          })
          .filter(id => id);
        
        if (activityIds.length > 0) {
          fetchActivityNames(activityIds);
        }
      } else {
        setError(response.data.error || 'Failed to fetch reviews');
        toast.error(response.data.error || 'Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(error.message || 'Failed to load reviews');
      toast.error(error.message || 'Failed to load reviews');
      
      setReviews([]);
      setTotalPages(1);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  };

  const getActivityInfo = (review) => {
    let activityId = '';
    let activityName = 'Unknown Activity';
    
    if (review.activity) {
      if (typeof review.activity === 'object') {
        activityId = review.activity._id || review.activity.id || review.activity;
        activityName = review.activity.name || 
                       review.activity.title || 
                       (activityId ? activityNames[activityId] : 'Unknown Activity');
      } else if (typeof review.activity === 'string') {
        activityId = review.activity;
        activityName = activityNames[activityId] || `Activity (ID: ${activityId.substring(0, 6)}...)`;
      }
    }
    
    return {
      id: activityId,
      name: activityName
    };
  };

  const getUserInfo = (review) => {
    if (review.user) {
      if (typeof review.user === 'object') {
        return review.user.name || 
               review.user.username || 
               review.user.email?.split('@')[0] || 
               'User';
      }
      
      if (typeof review.user === 'string') {
        return 'User ID: ' + review.user.substring(0, 6) + '...';
      }
    }
    
    return 'Anonymous';
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    
    try {
      await activityReviewsAPI.adminDelete(selectedReview._id);
      toast.success('Review deleted successfully');
      fetchReviews();
      setDeleteDialogOpen(false);
      setSelectedReview(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleReviewAction = async (action) => {
    if (!selectedReview) return;
    
    try {
      if (action === 'approve') {
        await activityReviewsAPI.updateStatus(selectedReview._id, 'approved');
        toast.success('Review approved successfully');
      } else if (action === 'reject') {
        await activityReviewsAPI.updateStatus(selectedReview._id, 'rejected');
        toast.success('Review rejected successfully');
      }
      
      fetchReviews();
      setActionDialogOpen(false);
      setSelectedReview(null);
      setCurrentAction(null);
    } catch (error) {
      console.error(`Error ${action}ing review:`, error);
      toast.error(`Failed to ${action} review`);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${
              i < rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating?.toFixed(1) || '0.0'}
        </span>
      </div>
    );
  };

  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    };

    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Excursions Reviews</h1>
        <p className="text-gray-600 mb-8">
          Manage and moderate customer reviews for excursions
        </p>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <button
                  onClick={fetchReviews}
                  className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
                >
                  Try again →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excursion & Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Loading reviews...</p>
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-center">
                        <FaStar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No reviews found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          When customers leave reviews, they'll appear here
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={fetchReviews}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <FaSync className="w-4 h-4 mr-2" />
                            Refresh
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => {
                    const activityInfo = getActivityInfo(review);
                    const userInfo = getUserInfo(review);
                    
                    return (
                      <tr key={review._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activityInfo.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {review.comment && (
                              <div className="max-w-xs truncate">
                                {review.comment}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userInfo}
                          </div>
                          {review.user?.email && (
                            <div className="text-sm text-gray-500">
                              {review.user.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStars(review.rating)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            review.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : review.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewReview(review)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <FaEye className="w-5 h-5" />
                            </button>
                            {review.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setCurrentAction('approve');
                                    setActionDialogOpen(true);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Approve"
                                >
                                  <FaCheck className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setCurrentAction('reject');
                                    setActionDialogOpen(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Reject"
                                >
                                  <FaTimes className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedReview(review);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <FaTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && <PaginationComponent />}
        </div>

        {/* View Review Dialog */}
        {viewDialogOpen && selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Review Details
                  </h2>
                  <button
                    onClick={() => setViewDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      User Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium">
                        {getUserInfo(selectedReview)}
                      </p>
                      {selectedReview.user?.email && (
                        <p className="text-gray-600 text-sm mt-1">
                          {selectedReview.user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Excursion Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium">
                        {getActivityInfo(selectedReview).name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Rating
                    </h3>
                    <div className="flex items-center">
                      {renderStars(selectedReview.rating)}
                    </div>
                  </div>

                  {selectedReview.title && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Review Title
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 font-medium">
                          "{selectedReview.title}"
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Comment
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedReview.comment || 'No comment provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Submitted on:{' '}
                      {new Date(selectedReview.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedReview.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : selectedReview.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedReview.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between">
                <button
                  onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedReview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedReview.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCurrentAction('approve');
                        setActionDialogOpen(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setCurrentAction('reject');
                        setActionDialogOpen(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Delete Review
                </h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this review from{' '}
                  <strong>{getUserInfo(selectedReview)}</strong>{' '}
                  for{' '}
                  <strong>
                    {getActivityInfo(selectedReview).name}
                  </strong>
                  ?
                </p>
                {selectedReview.comment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Comment:</strong>{' '}
                      {selectedReview.comment.substring(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedReview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Confirmation Dialog */}
        {actionDialogOpen && selectedReview && currentAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {currentAction === 'approve' ? 'Approve' : 'Reject'} Review
                </h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to {currentAction} this review from{' '}
                  <strong>{getUserInfo(selectedReview)}</strong>{' '}
                  for{' '}
                  <strong>
                    {getActivityInfo(selectedReview).name}
                  </strong>
                  ?
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setActionDialogOpen(false);
                    setSelectedReview(null);
                    setCurrentAction(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewAction(currentAction)}
                  className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${
                    currentAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {currentAction === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminActivityReviews;