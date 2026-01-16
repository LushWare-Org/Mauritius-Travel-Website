import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ActivityReviews from './activity/ActivityReviews';
import TourAdminFeedbackPanel from './TourReview/TourAdminFeedbackPanel';
import AdminLayout from '../../../components/admin/AdminLayout';

const ReviewsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get active tab from URL parameters
  const params = new URLSearchParams(location.search);
  const activeTab = params.get('tab') || 'tours';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // You can fetch review stats here if needed
  }, []);

  // Change tab function that updates URL
  const changeTab = (tabName) => {
    navigate(`/admin/reviews?tab=${tabName}`);
  };

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 mb-6 flex justify-between items-center bg-gradient-to-r from-white to-blue-50 p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Reviews & Feedback Management</h1>
          <p className="text-gray-500 text-sm">Monitor and respond to customer reviews and feedback</p>
        </div>
        <div className="text-sm bg-white py-2 px-3 rounded-md shadow-sm border border-gray-100 text-gray-600">
          <i className="far fa-star mr-2"></i>
          Customer Feedback
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => changeTab('tours')}
            className={`${
              activeTab === 'tours'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center`}
          >
            <i className="fas fa-route mr-2"></i>
            Tour Feedbacks
          </button>
          <button
            onClick={() => changeTab('excursions')}
            className={`${
              activeTab === 'excursions'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center`}
          >
            <i className="fas fa-hiking mr-2"></i>
            Excursion Reviews
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button 
                  onClick={() => setError('')}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading reviews data...</p>
        </div>
      ) : (
        <>
          {/* Tour Feedbacks Tab */}
          {activeTab === 'tours' && (
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Tour Package Feedback Management</h2>
                    <p className="text-gray-600 text-sm mt-1">View and manage customer feedback for tour packages</p>
                  </div>
                  <div className="text-sm bg-blue-100 text-blue-700 py-2 px-3 rounded-md font-medium">
                    <i className="fas fa-star-half-alt mr-2"></i>
                    Customer Ratings
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fas fa-info-circle text-blue-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        This section allows you to manage all customer feedback for tour packages. 
                      </p>
                    </div>
                  </div>
                </div>
                
                <TourAdminFeedbackPanel />
              </div>
            </div>
          )}

          {/* Excursion Reviews Tab */}
          {activeTab === 'excursions' && (
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-green-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Excursion Reviews Management</h2>
                    <p className="text-gray-600 text-sm mt-1">View and manage customer reviews for excursions</p>
                  </div>
                  <div className="text-sm bg-green-100 text-green-700 py-2 px-3 rounded-md font-medium">
                    <i className="fas fa-star mr-2"></i>
                    Activity Ratings
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fas fa-info-circle text-green-500 text-lg"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        This section allows you to manage all customer reviews for excursions. 
                      </p>
                    </div>
                  </div>
                </div>
                
                <ActivityReviews />
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default ReviewsPage;