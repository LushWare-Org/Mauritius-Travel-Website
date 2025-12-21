// src/pages/admin/activity/ActivityReviews.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { activityReviewsAPI, activitiesAPI } from '../../../utils/api';
import { FaStar, FaEye, FaTrash, FaUser, FaCalendar, FaSync, FaExclamationTriangle } from 'react-icons/fa';

const AdminActivityReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [activityNames, setActivityNames] = useState({}); // Cache for activity names
  const [fetchingNames, setFetchingNames] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [page]);

  // Fetch activity names for activity IDs
  const fetchActivityNames = useCallback(async (activityIds) => {
    try {
      setFetchingNames(true);
      const uniqueIds = [...new Set(activityIds.filter(id => id && !activityNames[id]))];
      
      if (uniqueIds.length === 0) return;
      
      console.log('Fetching activity names for IDs:', uniqueIds);
      
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
      console.log('📋 Fetching reviews for moderation, page:', page);
      
      // Try different endpoints if the main one fails
      let response;
      
      try {
        // Try the admin moderation endpoint first
        response = await activityReviewsAPI.getAllForModeration({
          page,
          limit: 10
        });
        console.log('✅ Admin moderation response:', response.data);
      } catch (modError) {
        console.warn('⚠️ Admin moderation endpoint failed, trying getAllReviews...');
        
        // Fallback to getAllReviews and filter on frontend
        response = await activityReviewsAPI.getAllReviews({
          page,
          limit: 10
        });
        
        // Filter for pending reviews
        if (response.data.success && response.data.data) {
          const allReviews = response.data.data;
          const pendingReviews = allReviews.filter(review => 
            review.status === 'pending' || !review.status || review.status === 'awaiting_moderation'
          );
          
          // Apply pagination manually
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
          
          console.log('✅ Frontend filtered reviews:', {
            total: pendingReviews.length,
            currentPage: paginatedReviews.length
          });
        }
      }
      
      console.log('📊 Final reviews data structure:', {
        hasData: !!response.data.data,
        dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
        dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
        success: response.data.success,
        pagination: response.data.pagination
      });
      
      if (response.data.success) {
        // Handle different response structures
        let reviewsData = [];
        
        if (Array.isArray(response.data.data)) {
          reviewsData = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data.data)) {
          reviewsData = response.data.data.data;
        } else if (response.data.reviews && Array.isArray(response.data.reviews)) {
          reviewsData = response.data.reviews;
        }
        
        console.log('📝 Extracted reviews:', reviewsData.length);
        
        // Ensure each review has proper structure
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
        
        // Extract activity IDs and fetch their names
        const activityIds = processedReviews
          .map(review => {
            // Handle different activity reference formats
            if (review.activity) {
              if (typeof review.activity === 'object') {
                return review.activity._id || review.activity.id || review.activity;
              }
              return review.activity; // string ID
            }
            return null;
          })
          .filter(id => id);
        
        if (activityIds.length > 0) {
          console.log('🔍 Fetching names for activity IDs:', activityIds);
          fetchActivityNames(activityIds);
        }
      } else {
        console.error('❌ API returned success: false', response.data);
        setError(response.data.error || 'Failed to fetch reviews');
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      setError(error.message || 'Failed to load reviews');
      
      // Set fallback empty state
      setReviews([]);
      setTotalPages(1);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get activity info
  const getActivityInfo = (review) => {
    let activityId = '';
    let activityName = 'Unknown Activity';
    
    // Extract activity ID
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

  // Helper function to get user info
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

  // Function to refresh activity names
  const refreshActivityNames = async () => {
    const activityIds = reviews
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
      await fetchActivityNames(activityIds);
    }
  };

  const handleDelete = async (reviewId, reviewTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${reviewTitle}"?`)) return;
    
    try {
      await activityReviewsAPI.adminDelete(reviewId);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await activityReviewsAPI.updateStatus(reviewId, 'approved');
      fetchReviews();
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await activityReviewsAPI.updateStatus(reviewId, 'rejected');
      fetchReviews();
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Failed to reject review');
    }
  };

  // Get the activity name display with refresh option
  const renderActivityName = (review) => {
    const activityInfo = getActivityInfo(review);
    
    if (fetchingNames && !activityNames[activityInfo.id]) {
      return (
        <div className="flex items-center">
          <span className="text-sm text-gray-500">Loading Excursion name...</span>
          <div className="animate-spin ml-2">
            <FaSync className="w-3 h-3 text-blue-500" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center group">
        {activityInfo.id ? (
          <Link 
            to={`/admin/activities/view/${activityInfo.id}`}
            className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors"
            title={activityInfo.name}
          >
            {activityInfo.name.length > 40 
              ? activityInfo.name.substring(0, 40) + '...' 
              : activityInfo.name}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-gray-800" title="No activity linked">
            {activityInfo.name}
          </span>
        )}
        {activityInfo.id && !activityInfo.name.includes('ID:') && !activityNames[activityInfo.id] && (
          <button
            onClick={() => fetchActivityNames([activityInfo.id])}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
            title="Fetch activity name"
          >
            <FaSync className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Excursions Reviews</h1>
              <p className="text-gray-500 mt-1">Manage all customer reviews</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshActivityNames}
                disabled={fetchingNames || reviews.length === 0}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <FaSync className={`w-4 h-4 mr-2 ${fetchingNames ? 'animate-spin' : ''}`} />
                Refresh Excursions Names
              </button>
              <button
                onClick={fetchReviews}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                Refresh Reviews
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-800">{totalReviews}</div>
              <div className="text-sm text-gray-500">Total Reviews</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {reviews.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending Review</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {reviews.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {reviews.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading reviews</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
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

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
            <div className="font-semibold text-gray-700 mb-2">Debug Info:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="text-gray-600">Loading: <span className="font-medium">{loading ? 'Yes' : 'No'}</span></div>
              <div className="text-gray-600">Reviews: <span className="font-medium">{reviews.length}</span></div>
              <div className="text-gray-600">Page: <span className="font-medium">{page} of {totalPages}</span></div>
              <div className="text-gray-600">Total: <span className="font-medium">{totalReviews}</span></div>
            </div>
            <button
              onClick={() => console.log('Reviews data:', reviews)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Log Reviews Data to Console
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <FaStar className="mx-auto text-gray-300 text-4xl mb-3" />
              <h3 className="text-lg font-medium text-gray-500">No reviews found</h3>
              <p className="text-gray-400 mt-1">When customers leave reviews, they'll appear here</p>
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
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Excursions & Review</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rating</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reviews.map((review) => {
                      const userInfo = getUserInfo(review);
                      
                      return (
                        <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                  <FaStar className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  {renderActivityName(review)}
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <FaUser className="w-3 h-3 mr-1" />
                                    {userInfo}
                                    {review.user?.email && (
                                      <span className="ml-2 text-gray-400">
                                        ({review.user.email})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="ml-11">
                                {review.title && (
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    "{review.title}"
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {review.comment || 'No comment provided'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex mr-3">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar 
                                    key={i} 
                                    className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                {review.rating || 0}.0
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <FaCalendar className="w-4 h-4 mr-2 text-gray-400" />
                              {review.createdAt ? (
                                new Date(review.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              ) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800' :
                              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {review.status?.charAt(0).toUpperCase() + review.status?.slice(1) || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Link
                                to={`/admin/activity-reviews/${review._id}`}
                                className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <FaEye className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(review._id, review.title || 'Untitled Review')}
                                className="inline-flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Review"
                              >
                                <FaTrash className="w-5 h-5" />
                              </button>
                              {review.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(review._id)}
                                    className="inline-flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm"
                                    title="Approve Review"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(review._id)}
                                    className="inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm"
                                    title="Reject Review"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityReviews;