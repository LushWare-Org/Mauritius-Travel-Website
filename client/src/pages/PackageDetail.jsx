// pages/PackageDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackDisplay from '../components/FeedbackDisplay';
import { FaStar, FaRupeeSign, FaEuroSign } from 'react-icons/fa';

const PackageDetail = ({ packageId }) => {
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState(null);

  // Helper function to get display price
  const getDisplayPrice = (pkg) => {
    if (!pkg) return { display: '', rs: 0, euro: 0 };
    
    switch(pkg.currencyType) {
      case 'both':
        return {
          rs: pkg.priceRs,
          euro: pkg.priceEuro,
          display: `Rs ${pkg.priceRs} / € ${pkg.priceEuro}`
        };
      case 'rs-only':
        return {
          rs: pkg.priceRs,
          euro: null,
          display: `Rs ${pkg.priceRs}`
        };
      case 'euro-only':
        return {
          rs: null,
          euro: pkg.priceEuro,
          display: `€ ${pkg.priceEuro}`
        };
      default:
        return {
          rs: pkg.price,
          euro: null,
          display: `Rs ${pkg.price}`
        };
    }
  };

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

  const priceDisplay = getDisplayPrice(packageData);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Package Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{packageData.name}</h1>
        <p className="text-gray-600 mb-4">{packageData.description}</p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <FaStar className="mr-1" />
              <span className="font-bold">{packageData.averageRating.toFixed(1)}</span>
              <span className="ml-1">({packageData.totalRatings} reviews)</span>
            </div>
          </div>
          
          {/* Price Display with Currency Indicators */}
          <div className="flex flex-col items-end">
            <div className="flex items-center text-2xl font-bold text-green-600">
              {packageData.currencyType === 'euro-only' ? (
                <FaEuroSign className="mr-2" />
              ) : (
                <FaRupeeSign className="mr-2" />
              )}
              {priceDisplay.display}
            </div>
            
            {/* Currency Type Indicator */}
            {packageData.currencyType && (
              <span className={`text-xs mt-1 px-2 py-1 rounded ${
                packageData.currencyType === 'both' 
                  ? 'bg-green-100 text-green-800'
                  : packageData.currencyType === 'rs-only'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {packageData.currencyType === 'both' 
                  ? 'Rs & Euro Available' 
                  : packageData.currencyType === 'rs-only'
                  ? 'Rs Only'
                  : 'Euro Only'}
              </span>
            )}
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