// pages/PackageDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import { FaStar } from 'react-icons/fa';

const PackageDetail = ({ packageId }) => {
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState(null);

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      const response = await axios.get(`/api/packages/${packageId}`);
      setPackageData(response.data);
    } catch (error) {
      console.error('Error fetching package:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFeedback = (feedback) => {
    setNewFeedback(feedback);
    fetchPackageDetails(); // Refresh package data with new rating
  };

  if (loading) return <div>Loading...</div>;
  if (!packageData) return <div>Package not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Package Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{packageData.name}</h1>
        <p className="text-gray-600 mb-4">{packageData.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <FaStar className="mr-1" />
              <span className="font-bold">{packageData.averageRating.toFixed(1)}</span>
              <span className="ml-1">({packageData.totalRatings} reviews)</span>
            </div>
            <span className="ml-4 text-2xl font-bold text-green-600">
              Rs {packageData.price}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <FeedbackForm 
        packageId={packageId} 
        onFeedbackSubmit={handleNewFeedback}
      />

      {/* Feedback Display */}
      <FeedbackDisplay packageId={packageId} />
    </div>
  );
};

export default PackageDetail;