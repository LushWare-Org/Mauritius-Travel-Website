import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { airportTransferAPI } from '../utils/airportTransferApi';
import LoadingSpinner from './common/LoadingSpinner';

const AirportTransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await airportTransferAPI.getActive();
      if (response.data.success) setTransfers(response.data.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Airport Transfers</h1>
        <p className="text-gray-600">Reliable transportation to your destination</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transfers.map((transfer) => (
          <div key={transfer._id} className="bg-white rounded-xl shadow-md border border-gray-200">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-xl">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
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
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>{transfer.capacity} people</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{transfer.estimatedTime}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">One Way</span>
                  <span className="font-bold text-blue-600">${transfer.oneWayPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-green-700">Round Trip</span>
                  <span className="font-bold text-green-600">${transfer.roundTripPrice}</span>
                </div>
              </div>

              {/* Button */}
              <Link
                to={`/airport-transfer/book/${transfer._id}`}
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-700 mb-4">No transfers available</p>
          <button
            onClick={fetchTransfers}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default AirportTransferList;