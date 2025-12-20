import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { airportTransferAPI } from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AirportTransferForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    airportName: '',
    airportCode: '',
    oneWayPriceMUR: '',
    oneWayPriceEUR: '',
    roundTripPriceMUR: '',
    roundTripPriceEUR: '',
    description: '',
    estimatedTime: '30-45 minutes',
    capacity: 4,
    vehicleType: 'car',
    isActive: true,
  });

  const vehicleOptions = [
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' },
    { value: 'bus', label: 'Bus' },
    { value: 'speedboat', label: 'Speedboat' },
    { value: 'seaplane', label: 'Seaplane' }
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchTransfer();
    }
  }, [id]);

  const fetchTransfer = async () => {
    try {
      setLoading(true);
      console.log('Fetching transfer with ID:', id);
      
      const response = await airportTransferAPI.getById(id);
      console.log('Transfer fetch response:', response.data);

      if (response.data.success) {
        const transfer = response.data.data;
        console.log('Transfer data received:', transfer);
        
        setFormData({
          airportName: transfer.airportName || '',
          airportCode: transfer.airportCode || '',
          oneWayPriceMUR: transfer.oneWayPriceMUR || transfer.oneWayPrice || '',
          oneWayPriceEUR: transfer.oneWayPriceEUR || '',
          roundTripPriceMUR: transfer.roundTripPriceMUR || transfer.roundTripPrice || '',
          roundTripPriceEUR: transfer.roundTripPriceEUR || '',
          description: transfer.description || '',
          estimatedTime: transfer.estimatedTime || '30-45 minutes',
          capacity: transfer.capacity || 4,
          vehicleType: transfer.vehicleType || 'car',
          isActive: transfer.isActive !== false,
        });
        setError('');
      } else {
        setError('Transfer not found');
      }
    } catch (err) {
      console.error('Error fetching transfer:', err.response || err.message);
      setError('Failed to load transfer details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    // Reset errors
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.airportName.trim()) {
      setError('Airport name is required');
      return false;
    }

    if (!formData.airportCode.trim()) {
      setError('Airport code is required');
      return false;
    }

    // Validate MUR prices
    if (!formData.oneWayPriceMUR || parseFloat(formData.oneWayPriceMUR) <= 0) {
      setError('Valid one-way price (MUR) is required');
      return false;
    }

    if (!formData.roundTripPriceMUR || parseFloat(formData.roundTripPriceMUR) <= 0) {
      setError('Valid round-trip price (MUR) is required');
      return false;
    }

    // Validate EUR prices
    if (!formData.oneWayPriceEUR || parseFloat(formData.oneWayPriceEUR) <= 0) {
      setError('Valid one-way price (EUR) is required');
      return false;
    }

    if (!formData.roundTripPriceEUR || parseFloat(formData.roundTripPriceEUR) <= 0) {
      setError('Valid round-trip price (EUR) is required');
      return false;
    }

    // Validate round-trip is greater than one-way
    if (parseFloat(formData.roundTripPriceMUR) <= parseFloat(formData.oneWayPriceMUR)) {
      setError('Round-trip price (MUR) should be greater than one-way price');
      return false;
    }

    if (parseFloat(formData.roundTripPriceEUR) <= parseFloat(formData.oneWayPriceEUR)) {
      setError('Round-trip price (EUR) should be greater than one-way price');
      return false;
    }

    if (!formData.capacity || formData.capacity < 1) {
      setError('Valid capacity is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting form data:', formData);
      
      const data = {
        airportName: formData.airportName.trim(),
        airportCode: formData.airportCode.trim().toUpperCase(),
        oneWayPriceMUR: parseFloat(formData.oneWayPriceMUR),
        oneWayPriceEUR: parseFloat(formData.oneWayPriceEUR),
        roundTripPriceMUR: parseFloat(formData.roundTripPriceMUR),
        roundTripPriceEUR: parseFloat(formData.roundTripPriceEUR),
        description: formData.description.trim(),
        estimatedTime: formData.estimatedTime,
        capacity: parseInt(formData.capacity),
        vehicleType: formData.vehicleType,
        isActive: formData.isActive,
      };

      console.log('Sending API request with data:', data);

      let response;

      if (isEditMode) {
        response = await airportTransferAPI.update(id, data);
      } else {
        response = await airportTransferAPI.create(data);
      }

      console.log('API response:', response.data);

      if (response.data.success) {
        setSuccess(isEditMode ? 'Transfer updated successfully!' : 'Transfer created successfully!');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/admin/airport-transfers');
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to save transfer');
      }
    } catch (err) {
      console.error('Error saving transfer:', err.response || err.message);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to save transfer. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Airport Transfer' : 'Add New Airport Transfer'}
            </h1>
            <p className="text-gray-600">
              {isEditMode ? 'Update airport transfer details' : 'Create a new airport transfer service'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-8">
              {/* Airport Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Airport Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Airport Name *
                    </label>
                    <input
                      type="text"
                      name="airportName"
                      value={formData.airportName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="e.g., Sir Seewoosagur Ramgoolam International Airport"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel Name*
                    </label>
                    <input
                      type="text"
                      name="airportCode"
                      value={formData.airportCode}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="e.g., MRU"
                    />
                  </div>
                </div>
              </div>

              {/* One-Way Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  One-Way Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (MUR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">Rs</span>
                      <input
                        type="number"
                        step="0.01"
                        name="oneWayPriceMUR"
                        value={formData.oneWayPriceMUR}
                        onChange={handleInputChange}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        placeholder="2000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (EUR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        name="oneWayPriceEUR"
                        value={formData.oneWayPriceEUR}
                        onChange={handleInputChange}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Round-Trip Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Round-Trip Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (MUR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">Rs</span>
                      <input
                        type="number"
                        step="0.01"
                        name="roundTripPriceMUR"
                        value={formData.roundTripPriceMUR}
                        onChange={handleInputChange}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        placeholder="3600.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (EUR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        name="roundTripPriceEUR"
                        value={formData.roundTripPriceEUR}
                        onChange={handleInputChange}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        placeholder="90.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {vehicleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="1"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      name="estimatedTime"
                      value={formData.estimatedTime}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="30-45 minutes"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Describe the transfer service, amenities, special features, etc."
                />
              </div>

              {/* Status */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  id="isActive"
                />
                <label
                  htmlFor="isActive"
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  Active (visible to customers for booking)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin/airport-transfers')}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {isEditMode ? 'Update Transfer' : 'Create Transfer'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AirportTransferForm;