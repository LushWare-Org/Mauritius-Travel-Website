import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { airportTransferAPI, airportTransferBookingAPI } from '../utils/airportTransferApi';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const AirportTransferBookingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state - removed passengers but backend might still expect it
  const [formData, setFormData] = useState({
    transfer: id || '',
    guestName: '',
    email: '',
    phone: '',
    flightNumber: '',
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: '',
    tripType: 'one-way',
    transferType: 'airport-to-hotel',
    passengers: 1, // Keep for backend but don't show in form
    specialRequests: ''
  });

  useEffect(() => {
    if (id) {
      fetchTransfer();
    } else {
      fetchAllTransfers();
    }
    
    // Pre-fill user data if logged in
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        guestName: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    }
  }, [id, currentUser]);

  const fetchTransfer = async () => {
    try {
      setLoading(true);
      const response = await airportTransferAPI.getById(id);
      
      if (response.data.success) {
        setTransfer(response.data.data);
        setFormData(prev => ({ ...prev, transfer: id }));
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

  const fetchAllTransfers = async () => {
    try {
      setLoading(true);
      const response = await airportTransferAPI.getActive();
      
      if (response.data.success && response.data.data.length > 0) {
        setTransfer(response.data.data[0]);
        setFormData(prev => ({ ...prev, transfer: response.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    if (!transfer) return 0;
    
    // Airport transfer is a flat rate regardless of number of passengers
    // Convert to number to avoid NaN issues
    const oneWayPrice = parseFloat(transfer.oneWayPrice) || 0;
    const roundTripPrice = parseFloat(transfer.roundTripPrice) || 0;
    
    return formData.tripType === 'one-way' 
      ? oneWayPrice 
      : roundTripPrice;
  };

  const validateForm = () => {
    if (!transfer) {
      setError('Please select an airport transfer');
      return false;
    }
    
    if (!formData.guestName.trim()) {
      setError('Please enter your name');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    
    if (!formData.arrivalDate) {
      setError('Please select arrival date');
      return false;
    }
    
    if (!formData.arrivalTime) {
      setError('Please select arrival time');
      return false;
    }
    
    if (formData.tripType === 'round-trip' && !formData.departureDate) {
      setError('Please select departure date for round trip');
      return false;
    }
    
    if (formData.tripType === 'round-trip' && !formData.departureTime) {
      setError('Please select departure time for round trip');
      return false;
    }
    
    // Ensure passengers is a valid number (backend requires it)
    const passengers = parseInt(formData.passengers) || 1;
    if (passengers < 1) {
      setError('Invalid passenger count');
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
      const totalPrice = calculateTotal();
      
      // Ensure totalPrice is a valid number
      if (isNaN(totalPrice) || totalPrice <= 0) {
        setError('Invalid transfer pricing. Please try again.');
        setSubmitting(false);
        return;
      }
      
      const bookingData = {
        ...formData,
        totalPrice: totalPrice,
        // Ensure passengers is sent as number (even though it's flat rate)
        passengers: parseInt(formData.passengers) || 1,
        arrivalDate: new Date(formData.arrivalDate),
        departureDate: formData.departureDate ? new Date(formData.departureDate) : null,
        // Ensure price fields are numbers
        oneWayPrice: parseFloat(transfer.oneWayPrice) || 0,
        roundTripPrice: parseFloat(transfer.roundTripPrice) || 0,
      };
      
      console.log('Submitting booking data:', bookingData);
      
      const response = await airportTransferBookingAPI.createBooking(bookingData);
      
      if (response.data.success) {
        // Redirect to confirmation or dashboard
        navigate('/dashboard/airport-transfers', {
          state: { 
            bookingSuccess: true,
            bookingReference: response.data.data.bookingReference
          }
        });
      } else {
        setError(response.data.error || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to create booking. Please try again.';
      setError(errorMessage);
      
      // Log more details for debugging
      if (err.response?.data?.errors) {
        console.error('Validation errors:', err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Book Airport Transfer</h1>
        <p className="text-gray-600">Secure your comfortable transfer between the airport and our resort</p>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transfer Selection */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Select Transfer Service</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Airport Transfer *</label>
                  <select
                    name="transfer"
                    value={formData.transfer}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an airport transfer</option>
                    {transfer && (
                      <option value={transfer._id}>
                        {transfer.airportName} ({transfer.airportCode}) - {transfer.vehicleType}
                      </option>
                    )}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 mb-2">Trip Type *</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tripType"
                          value="one-way"
                          checked={formData.tripType === 'one-way'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span>One Way</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tripType"
                          value="round-trip"
                          checked={formData.tripType === 'round-trip'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <span>Round Trip</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-600 mb-2">Transfer Type *</label>
                    <select
                      name="transferType"
                      value={formData.transferType}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="airport-to-hotel">Airport to Hotel</option>
                      <option value="hotel-to-airport">Hotel to Airport</option>
                      <option value="both">Both Directions</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="guestName"
                    value={formData.guestName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                    placeholder="+960 XXX XXXX"
                  />
                </div>
              </div>
              {/* Hidden passengers field - backend requires it but we don't show it */}
              <input
                type="hidden"
                name="passengers"
                value={formData.passengers}
              />
              <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <i className="fas fa-info-circle mr-2"></i>
                Note: Airport transfer price is a flat rate for any number of passengers
              </div>
            </div>

            {/* Flight Details */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Flight Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">Flight Number</label>
                  <input
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="EK658"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Arrival Date *</label>
                  <input
                    type="date"
                    name="arrivalDate"
                    value={formData.arrivalDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-2">Arrival Time *</label>
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                
                {formData.tripType === 'round-trip' && (
                  <>
                    <div>
                      <label className="block text-gray-600 mb-2">Departure Date *</label>
                      <input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required={formData.tripType === 'round-trip'}
                        min={formData.arrivalDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-2">Departure Time *</label>
                      <input
                        type="time"
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required={formData.tripType === 'round-trip'}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Special Requests</h2>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Any special requirements, additional stops, accessibility needs, etc."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !transfer}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing Booking...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2"></i>
                  Confirm Booking - ${calculateTotal().toFixed(2)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-6 pb-4 border-b">Booking Summary</h2>
            
            {transfer && (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-semibold text-gray-800">{transfer.airportName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airport Code:</span>
                    <span className="font-semibold">{transfer.airportCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle Type:</span>
                    <span className="font-semibold capitalize">{transfer.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trip Type:</span>
                    <span className="font-semibold capitalize">{formData.tripType.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Type:</span>
                    <span className="font-semibold">
                      {formData.transferType === 'airport-to-hotel' && 'Airport → Hotel'}
                      {formData.transferType === 'hotel-to-airport' && 'Hotel → Airport'}
                      {formData.transferType === 'both' && 'Both Directions'}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Price:</span>
                      <span className="font-semibold">
                        ${formData.tripType === 'one-way' ? 
                          (parseFloat(transfer.oneWayPrice) || 0).toFixed(2) : 
                          (parseFloat(transfer.roundTripPrice) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-blue-600 mb-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Flat rate for any number of passengers
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-xl">
                      <span className="text-gray-800 font-bold">Total Amount:</span>
                      <span className="text-blue-600 font-bold">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">What's Included</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      Meet & greet service
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      Flight monitoring
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      Luggage assistance
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      Professional driver
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-green-500 mr-2"></i>
                      Free waiting time (60 mins)
                    </li>
                  </ul>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p className="mb-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Free cancellation up to 24 hours before pickup
                  </p>
                  <p className="mb-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Confirmation will be sent to your email
                  </p>
                  <p>
                    <i className="fas fa-info-circle mr-1"></i>
                    Price includes all passengers - no per person charge
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirportTransferBookingForm;