import React, { useState } from 'react';
import ActivityReviews from './activity/ActivityReviews';
import TourAdminFeedbackPanel from './TourReview/TourAdminFeedbackPanel';

const ReviewsPage = () => {
  const [activeTab, setActiveTab] = useState('tours'); // Default to tours tab

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Reviews & Feedbacks
            </h1>
            <p className="text-gray-600 text-sm">
              Manage all customer reviews and feedbacks
            </p>
          </div>
        </div>
      </div>

     {/* Pill-shaped Tab Navigation */}
<div className="mb-8">
  <nav className="flex space-x-2 bg-gray-100 p-1 rounded-xl" aria-label="Tabs">
    <button
      onClick={() => setActiveTab('tours')}
      className={`${
        activeTab === 'tours'
          ? 'bg-white text-blue-700 shadow-sm font-semibold'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
      } flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-200 rounded-lg flex items-center justify-center`}
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      Tour Feedbacks
    </button>
    <button
      onClick={() => setActiveTab('excursions')}
      className={`${
        activeTab === 'excursions'
          ? 'bg-white text-green-700 shadow-sm font-semibold'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
      } flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-200 rounded-lg flex items-center justify-center`}
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      Excursion Reviews
    </button>
  </nav>
</div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tours' && <TourAdminFeedbackPanel />}
        {activeTab === 'excursions' && <ActivityReviews />}
      </div>
    </div>
  );
};

export default ReviewsPage;
