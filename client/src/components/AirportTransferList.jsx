import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { airportTransferAPI } from '../utils/airportTransferApi';
import LoadingSpinner from './common/LoadingSpinner';

const AirportTransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await airportTransferAPI.getActive();
      
      if (response.data.success) {
        setTransfers(response.data.data);
      } else {
        setError('Failed to load transfers');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load airport transfers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Airport Transfers</h1>
        <p className="text-gray-600">Choose your preferred airport transfer option</p>
      </div>

      {/* Grid with proper container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transfers.map((transfer) => (
          <div
            key={transfer._id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-800 text-white p-4">
              <div className="flex items-center">
                <span className="text-xl mr-3">✈️</span>
                <div>
                  <h3 className="font-bold">{transfer.airportName}</h3>
                  <p className="text-sm opacity-90">{transfer.airportCode}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Details */}
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <span className="mr-2">👥</span>
                  <span>Up to {transfer.capacity}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⏱️</span>
                  <span>{transfer.estimatedTime}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="mb-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-800">One Way</p>
                    <p className="text-xs text-gray-500">Per vehicle</p>
                  </div>
                  <span className="text-lg font-bold text-blue-800">
                    ${transfer.oneWayPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-green-700">Round Trip</p>
                    <p className="text-xs text-green-600">Return included</p>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    ${transfer.roundTripPrice}
                  </span>
                </div>
              </div>

              {/* Button */}
              <Link
                to={`/airport-transfer/book/${transfer._id}`}
                className="block w-full bg-blue-800 text-white text-center py-2.5 rounded text-sm font-medium hover:bg-blue-900"
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <span className="text-xl">✈️</span>
          </div>
          <p className="text-gray-700">No airport transfers available</p>
        </div>
      )}
    </div>
  );
};

export default AirportTransferList;