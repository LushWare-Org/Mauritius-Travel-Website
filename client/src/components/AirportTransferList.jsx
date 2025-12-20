import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { airportTransferAPI } from '../utils/api';
import LoadingSpinner from './common/LoadingSpinner';

const AirportTransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('MUR'); // Default currency

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      console.log('Fetching active transfers...');
      
      const response = await airportTransferAPI.getActive();
      console.log('Transfers API response:', response.data);

      if (response.data.success) {
        setTransfers(response.data.data || []);
        setError('');
      } else {
        setError('Failed to load transfers');
        setTransfers([]);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfers. Please try again.');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (transfer, tripType) => {
    if (currency === 'EUR') {
      return tripType === 'one-way' 
        ? (transfer.oneWayPriceEUR || 0)
        : (transfer.roundTripPriceEUR || 0);
    }
    return tripType === 'one-way' 
      ? (transfer.oneWayPriceMUR || transfer.oneWayPrice || 0)
      : (transfer.roundTripPriceMUR || transfer.roundTripPrice || 0);
  };

  const getCurrencySymbol = () => {
    return currency === 'EUR' ? '€' : 'Rs ';
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `${getCurrencySymbol()}${numPrice.toFixed(2)}`;
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
        
        {/* Currency Selector */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <span className="text-gray-700">Show prices in:</span>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setCurrency('MUR')}
              className={`px-4 py-2 ${currency === 'MUR' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              MUR (Rs)
            </button>
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-4 py-2 ${currency === 'EUR' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              EUR (€)
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchTransfers}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transfers.map((transfer) => (
          <div key={transfer._id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="capitalize">{transfer.vehicleType}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">One Way</span>
                  <div className="text-right">
                    <span className="font-bold text-blue-600">
                      {formatPrice(getPrice(transfer, 'one-way'))}
                    </span>
                    <div className="text-xs text-gray-500">
                      {currency === 'MUR' 
                        ? `€${transfer.oneWayPriceEUR?.toFixed(2) || '0.00'}` 
                        : `Rs ${transfer.oneWayPriceMUR?.toFixed(2) || '0.00'}`}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-green-700">Round Trip</span>
                  <div className="text-right">
                    <span className="font-bold text-green-600">
                      {formatPrice(getPrice(transfer, 'round-trip'))}
                    </span>
                    <div className="text-xs text-gray-500">
                      {currency === 'MUR' 
                        ? `€${transfer.roundTripPriceEUR?.toFixed(2) || '0.00'}` 
                        : `Rs ${transfer.roundTripPriceMUR?.toFixed(2) || '0.00'}`}
                    </div>
                  </div>
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

      {transfers.length === 0 && !loading && !error && (
        <div className="text-center py-10">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 text-lg mt-4 mb-2">No transfers available</p>
          <p className="text-gray-500 mb-4">Check back later or contact support</p>
          <button
            onClick={fetchTransfers}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default AirportTransferList;