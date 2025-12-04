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

  const getVehicleIcon = (type) => {
    switch(type) {
      case 'car': return 'fas fa-car';
      case 'van': return 'fas fa-shuttle-van';
      case 'bus': return 'fas fa-bus';
      case 'speedboat': return 'fas fa-ship';
      case 'seaplane': return 'fas fa-plane';
      default: return 'fas fa-car';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Airport Transfer Services
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Enjoy comfortable and reliable transfers between Velana International Airport (MLE) and our resort
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {transfers.map((transfer) => (
          <div
            key={transfer._id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <i className="fas fa-plane-departure text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {transfer.airportName}
                  </h3>
                  <p className="text-gray-500 text-sm">{transfer.airportCode}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">{transfer.description || 'Comfortable transfer service'}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <i className="fas fa-clock mr-2"></i>
                    <span>{transfer.estimatedTime}</span>
                  </div>
                  <div className="flex items-center">
                    <i className={getVehicleIcon(transfer.vehicleType) + ' mr-2'}></i>
                    <span className="capitalize">{transfer.vehicleType}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-users mr-2"></i>
                    <span>Up to {transfer.capacity}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-gray-600 font-medium">One Way</p>
                    <p className="text-sm text-gray-500">Per vehicle</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    ${transfer.oneWayPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <p className="text-blue-700 font-medium">Round Trip</p>
                    <p className="text-sm text-blue-600">Save with return</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-700">
                    ${transfer.roundTripPrice}
                  </span>
                </div>
              </div>

              <Link
                to={`/airport-transfer/book/${transfer._id}`}
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                Book Transfer
              </Link>
            </div>
          </div>
        ))}
      </div>

      {transfers.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-md mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-yellow-700">No airport transfers available at the moment.</p>
                <p className="text-yellow-600 text-sm mt-1">Please check back later.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirportTransferList;