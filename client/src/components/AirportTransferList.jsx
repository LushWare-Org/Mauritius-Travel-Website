import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { airportTransferAPI } from '../utils/api';
import LoadingSpinner from './common/LoadingSpinner';

const AirportTransferList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState(() => {
    // Get currency from URL params, localStorage, or default to MUR
    return searchParams.get('currency') || localStorage.getItem('preferredCurrency') || 'MUR';
  });

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

  const getCurrencySymbol = (curr = currency) => {
    const symbols = {
      'EUR': '€',
      'MUR': 'Rs'
    };
    return symbols[curr] || 'Rs ';
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `${getCurrencySymbol()}${numPrice.toFixed(2)}`;
  };

  // Handle currency changes
  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
    // Update URL with currency parameter
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('currency', newCurrency);
    setSearchParams(newSearchParams);
  };

  const currencySymbol = getCurrencySymbol();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-700 font-display">Airport Transfers</h1>
              <p className="text-gray-600 mt-2">Reliable transportation to your destination in Mauritius</p>
            </div>
           
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-1/4">
            {/* Currency Info */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Currency Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Selected:</span>
                  <span className="font-medium text-blue-600">
                    {currency} ({currencySymbol})
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <p>All prices are displayed in {currency}. The admin has set separate prices for each currency.</p>
                  <p className="mt-2">No automatic conversion is applied.</p>
                </div>
              </div>
            </div>
            
            {/* Transfer Count Info */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700 mb-3">Transfers Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transfers:</span>
                  <span className="font-medium">{transfers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Routes:</span>
                  <span className="font-medium text-blue-600">
                    {[...new Set(transfers.map(t => t.airportName))].length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg One-Way:</span>
                  <span className="font-medium text-green-600">
                    {transfers.length > 0 
                      ? `${currencySymbol}${Math.round(transfers.reduce((sum, t) => sum + getPrice(t, 'one-way'), 0) / transfers.length)}`
                      : `${currencySymbol}0`
                    }
                  </span>
                </div>
                {error && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={fetchTransfers}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <i className="fas fa-redo mr-1"></i>
                      Refresh transfers
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="w-full lg:w-3/4">
            {/* Search Info and Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 rounded-lg shadow transition-all hover:shadow-md">
              <div>
                <p className="text-gray-700 mb-3 sm:mb-0 font-medium">
                  <span className="text-2xl font-bold text-blue-600 mr-1">{transfers.length}</span> 
                  transfer routes available
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <i className="fas fa-money-bill-wave mr-1"></i>
                  Prices shown in <span className="font-medium">{currency} {currencySymbol}</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-3 sm:mt-0">
                {/* Currency Selector */}
                <div className="relative">
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="MUR">MUR (Rs)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <i className="fas fa-money-bill-wave text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-md text-center mb-6">
                <p className="text-lg font-medium">{error}</p>
                <button 
                  onClick={fetchTransfers}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
            
            {/* Transfer Listings */}
            {transfers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 text-6xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No transfers available</h3>
                <p className="text-gray-500 mb-6">
                  No transfer routes available at the moment. Please check back later or contact support.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  <i className="fas fa-money-bill-wave mr-1"></i>
                  Current currency: {currency} {currencySymbol}
                </p>
                <button
                  onClick={fetchTransfers}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Refresh Transfers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {transfers.map((transfer) => (
                  <div key={transfer._id} className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Header with Gradient */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{transfer.airportName}</h3>
                          <p className="text-blue-100 mt-1">{transfer.airportCode}</p>
                        </div>
                        <div className="text-right">
                          <div className="bg-white/20 rounded-lg px-3 py-1 inline-block">
                            <span className="text-sm font-medium">{transfer.vehicleType}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center text-gray-600">
                          <i className="fas fa-users text-blue-500 mr-2 w-5"></i>
                          <div>
                            <p className="text-sm text-gray-500">Capacity</p>
                            <p className="font-medium">{transfer.capacity} people</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <i className="fas fa-clock text-green-500 mr-2 w-5"></i>
                          <div>
                            <p className="text-sm text-gray-500">Estimated Time</p>
                            <p className="font-medium">{transfer.estimatedTime}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Cards */}
                      <div className="space-y-4 mb-6">
                        {/* One-Way Price */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-700">One Way</h4>
                              <p className="text-sm text-gray-500">Direct transfer</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-blue-600">
                                {formatPrice(getPrice(transfer, 'one-way'))}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {currency === 'MUR' 
                                  ? `€${transfer.oneWayPriceEUR?.toFixed(2) || '0.00'}` 
                                  : `Rs ${transfer.oneWayPriceMUR?.toFixed(2) || '0.00'}`}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Round-Trip Price */}
                        <div className="border border-green-200 bg-green-50 rounded-lg p-4 hover:border-green-300 transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-green-700">Round Trip</h4>
                              <p className="text-sm text-green-600">Return transfer included</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">
                                {formatPrice(getPrice(transfer, 'round-trip'))}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {currency === 'MUR' 
                                  ? `€${transfer.roundTripPriceEUR?.toFixed(2) || '0.00'}` 
                                  : `Rs ${transfer.roundTripPriceMUR?.toFixed(2) || '0.00'}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        to={`/airport-transfer/book/${transfer._id}`}
                        className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <i className="fas fa-calendar-check mr-2"></i>
                        Book Transfer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Currency Disclaimer */}
            {transfers.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">Currency Information</p>
                    <p className="text-xs text-blue-700">
                      Prices are shown in {currency} ({currencySymbol}). The admin has manually entered separate prices for EUR and MUR (Rs) currencies. 
                      There is no automatic currency conversion. When you book, the price will be in your selected currency.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirportTransferList;