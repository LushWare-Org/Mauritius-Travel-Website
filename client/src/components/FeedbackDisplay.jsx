// components/FeedbackDisplay.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaUserCircle } from 'react-icons/fa';

const FeedbackDisplay = ({ packageId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFeedbacks();
  }, [packageId, page]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/feedback/package/${packageId}`, {
        params: { page, limit: 5 }
      });

      if (response.data.success) {
        setFeedbacks(response.data.feedbacks);
        setAverageRating(response.data.averageRating);
        setTotalRatings(response.data.totalRatings);
        setTotalPages(response.data.pages);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        size={16}
        color={index < rating ? "#ffc107" : "#e4e5e9"}
      />
    ));
  };

  return (
    <div className="mt-8">
      {/* Average Rating Display */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Overall Rating</h3>
            <div className="flex items-center mt-2">
              <div className="flex">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="ml-2 text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="ml-2 text-gray-600">({totalRatings} ratings)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center">
                  <span className="w-10">{star} star</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full ml-2">
                    <div 
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${(feedbacks.filter(f => f.rating === star).length / totalRatings) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Feedbacks */}
      <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
      
      {loading ? (
        <div className="text-center py-8">Loading feedbacks...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review!
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {feedbacks.map((feedback) => (
              <div key={feedback._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <FaUserCircle size={32} className="text-gray-400" />
                    <div className="ml-3">
                      <p className="font-semibold">
                        {feedback.userId?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 border rounded ${
                    page === pageNum ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeedbackDisplay;