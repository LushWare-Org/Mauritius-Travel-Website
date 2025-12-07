import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { airportTransferAPI } from '../../utils/airportTransferApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AirportTransferForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    airportName: '',
    airportCode: '',
    oneWayPrice: '',
    roundTripPrice: '',
    description: '',
    estimatedTime: '30-45 minutes',
    capacity: 4,
    vehicleType: 'car',
    isActive: true,
  });

  useEffect(() => {
    if (isEditMode) {
      fetchTransfer();
    }
  }, [id]);

  const fetchTransfer = async () => {
    try {
      setLoading(true);
      const response = await airportTransferAPI.getById(id);

      if (response.data.success) {
        const transfer = response.data.data;
        setFormData({
          airportName: transfer.airportName,
          airportCode: transfer.airportCode,
          oneWayPrice: transfer.oneWayPrice,
          roundTripPrice: transfer.roundTripPrice,
          description: transfer.description || '',
          estimatedTime: transfer.estimatedTime || '30-45 minutes',
          capacity: transfer.capacity || 4,
          vehicleType: transfer.vehicleType || 'car',
          isActive: transfer.isActive,
        });
      } else {
        setError('Transfer not found');
      }
    } catch (err) {
      console.error('Error fetching transfer:', err);
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
    if (!formData.airportName.trim()) {
      setError('Airport name is required');
      return false;
    }

    if (!formData.airportCode.trim()) {
      setError('Airport code is required');
      return false;
    }

    if (!formData.oneWayPrice || formData.oneWayPrice <= 0) {
      setError('Valid one-way price is required');
      return false;
    }

    if (!formData.roundTripPrice || formData.roundTripPrice <= 0) {
      setError('Valid round-trip price is required');
      return false;
    }

    if (
      parseFloat(formData.roundTripPrice) <= parseFloat(formData.oneWayPrice)
    ) {
      setError('Round-trip price should be greater than one-way price');
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

    try {
      const data = {
        ...formData,
        oneWayPrice: parseFloat(formData.oneWayPrice),
        roundTripPrice: parseFloat(formData.roundTripPrice),
        capacity: parseInt(formData.capacity),
      };

      let response;

      if (isEditMode) {
        response = await airportTransferAPI.update(id, data);
      } else {
        response = await airportTransferAPI.create(data);
      }

      if (response.data.success) {
        navigate('/admin/airport-transfers');
      } else {
        setError(response.data.error || 'Failed to save transfer');
      }
    } catch (err) {
      console.error('Error saving transfer:', err);
      setError(
        err.response?.data?.error ||
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode
                ? 'Edit Airport Transfer'
                : 'Add New Airport Transfer'}
            </h1>
            <p className="text-gray-600">
              {isEditMode
                ? 'Update airport transfer details'
                : 'Create a new airport transfer service'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow rounded-lg p-6"
          >
            <div className="space-y-6">
              {/* Airport Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Airport Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Airport Name *
                    </label>
                    <input
                      type="text"
                      name="airportName"
                      value={formData.airportName}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      placeholder="e.g., Velana International Airport"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                     Hotel Name*
                    </label>
                    <input
                      type="text"
                      name="airportCode"
                      value={formData.airportCode}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md uppercase"
                      required
                      placeholder="hotel elegance"
                     
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      One-way Price ($) *
                    </label>
                    <input
                      type="number"
                      name="oneWayPrice"
                      value={formData.oneWayPrice}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Round-trip Price ($) *
                    </label>
                    <input
                      type="number"
                      name="roundTripPrice"
                      value={formData.roundTripPrice}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      min="0"
                      step="0.01"
                      placeholder="90.00"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Service Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type *
                    </label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="bus">Limo</option>
                      <option value="speedboat">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                      min="1"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      name="estimatedTime"
                      value={formData.estimatedTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="30-45 minutes"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Describe the transfer service, amenities, etc."
                />
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  id="isActive"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Active (visible to customers)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/admin/airport-transfers')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
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
