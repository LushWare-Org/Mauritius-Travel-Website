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
  const [countryCode, setCountryCode] = useState('+960'); // Default to Maldives
  const [phoneNumber, setPhoneNumber] = useState('');
  
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
    passengers: 1,
    specialRequests: ''
  });

  // Country codes for dropdown
  const countryCodes = [
    { code: '+960', name: 'Maldives', flag: '🇲🇻' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  ];

  useEffect(() => {
    if (id) {
      fetchTransfer();
    }
    
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        guestName: currentUser.name || '',
        email: currentUser.email || ''
      }));
      
      // If user has phone, try to parse country code
      if (currentUser.phone) {
        const phone = currentUser.phone.trim();
        // Check if phone starts with a known country code
        const foundCode = countryCodes.find(code => phone.startsWith(code.code));
        if (foundCode) {
          setCountryCode(foundCode.code);
          setPhoneNumber(phone.replace(foundCode.code, '').trim());
          setFormData(prev => ({ ...prev, phone }));
        } else {
          // Default to +960 and use whole phone
          setPhoneNumber(phone);
          setFormData(prev => ({ ...prev, phone: `+960${phone}` }));
        }
      }
    }
  }, [id, currentUser]);

  useEffect(() => {
    // Update formData.phone whenever countryCode or phoneNumber changes
    const fullPhone = phoneNumber.trim() ? `${countryCode}${phoneNumber.trim()}` : '';
    setFormData(prev => ({ ...prev, phone: fullPhone }));
  }, [countryCode, phoneNumber]);

  const fetchTransfer = async () => {
    try {
      setLoading(true);
      const response = await airportTransferAPI.getById(id);
      
      if (response.data.success) {
        setTransfer(response.data.data);
      } else {
        setError('Transfer not found');
      }
    } catch (err) {
      setError('Failed to load transfer details');
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

  const handleCountryCodeChange = (e) => {
    setCountryCode(e.target.value);
  };

  const handlePhoneNumberChange = (e) => {
    // Only allow numbers and common phone characters
    const value = e.target.value.replace(/[^0-9\s\-()]/g, '');
    setPhoneNumber(value);
  };

  const calculateTotal = () => {
    if (!transfer) return 0;
    
    const oneWayPrice = parseFloat(transfer.oneWayPrice) || 0;
    const roundTripPrice = parseFloat(transfer.roundTripPrice) || 0;
    
    return formData.tripType === 'one-way' ? oneWayPrice : roundTripPrice;
  };

  const validateForm = () => {
    const requiredFields = [
      { field: formData.guestName.trim(), message: 'Please enter your name' },
      { field: formData.email.trim(), message: 'Please enter your email' },
      { field: formData.phone.trim(), message: 'Please enter your phone number' },
      { field: formData.arrivalDate, message: 'Please select arrival date' },
      { field: formData.arrivalTime, message: 'Please select arrival time' }
    ];
    
    for (const { field, message } of requiredFields) {
      if (!field) {
        setError(message);
        return false;
      }
    }
    
    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number with country code');
      return false;
    }
    
    if (formData.tripType === 'round-trip') {
      if (!formData.departureDate) {
        setError('Please select departure date');
        return false;
      }
      if (!formData.departureTime) {
        setError('Please select departure time');
        return false;
      }
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
      
      if (isNaN(totalPrice) || totalPrice <= 0) {
        setError('Invalid transfer pricing');
        setSubmitting(false);
        return;
      }
      
      const bookingData = {
        ...formData,
        totalPrice,
        passengers: parseInt(formData.passengers) || 1,
        arrivalDate: new Date(formData.arrivalDate),
        departureDate: formData.departureDate ? new Date(formData.departureDate) : null,
        oneWayPrice: parseFloat(transfer.oneWayPrice) || 0,
        roundTripPrice: parseFloat(transfer.roundTripPrice) || 0,
      };
      
      const response = await airportTransferBookingAPI.createBooking(bookingData);
      
      if (response.data.success) {
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
      const errorMessage = err.response?.data?.error || 'Failed to create booking. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Book Airport Transfer</h1>
        <p className="text-gray-600">Secure your comfortable transfer</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transfer Selection */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-gray-100">
                Transfer Service
              </h2>
              
              {transfer && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-800 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-blue-900">{transfer.airportName}</p>
                      <p className="text-sm text-blue-700">{transfer.vehicleType} • {transfer.airportCode}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Trip Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tripType"
                        value="one-way"
                        checked={formData.tripType === 'one-way'}
                        onChange={handleInputChange}
                        className="mr-2 text-blue-800"
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
                        className="mr-2 text-blue-800"
                      />
                      <span>Round Trip</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Transfer Type</label>
                  <select
                    name="transferType"
                    value={formData.transferType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                  >
                    <option value="airport-to-hotel">Airport to Hotel</option>
                    <option value="hotel-to-airport">Hotel to Airport</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-gray-100">
                Personal Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    name="guestName"
                    value={formData.guestName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={handleCountryCodeChange}
                      className="w-32 p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Full number: {formData.phone || 'Not set'}
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Details */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-gray-100">
                Flight Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Flight Number (Optional)</label>
                  <input
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Arrival Date</label>
                    <input
                      type="date"
                      name="arrivalDate"
                      value={formData.arrivalDate}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Arrival Time</label>
                    <input
                      type="time"
                      name="arrivalTime"
                      value={formData.arrivalTime}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                      required
                    />
                  </div>
                </div>
                
                {formData.tripType === 'round-trip' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">Departure Date</label>
                      <input
                        type="date"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                        required
                        min={formData.arrivalDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 text-sm font-medium">Departure Time</label>
                      <input
                        type="time"
                        name="departureTime"
                        value={formData.departureTime}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-gray-100">
                Special Requests (Optional)
              </h2>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                rows="3"
                placeholder="Any special requirements..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !transfer}
              className="w-full bg-blue-800 text-white py-4 rounded-lg text-lg font-medium hover:bg-blue-900 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? (
                'Processing...'
              ) : (
                `Book Now - $${calculateTotal().toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        {/* Booking Summary */}
        <div>
          <div className="bg-white p-5 rounded-lg border border-gray-200 sticky top-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Booking Summary</h2>
            
            {transfer && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Transfer:</span>
                    <span className="font-medium">{transfer.airportCode}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{formData.tripType.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium capitalize">{transfer.vehicleType}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Price:</span>
                    <span className="font-medium">
                      ${formData.tripType === 'one-way' ? 
                        (parseFloat(transfer.oneWayPrice) || 0).toFixed(2) : 
                        (parseFloat(transfer.roundTripPrice) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded">
                    Flat rate for all passengers
                  </div>
                  
                  <div className="flex justify-between text-lg pt-3 border-t border-gray-200">
                    <span className="text-blue-900 font-semibold">Total:</span>
                    <span className="text-blue-900 font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Mauritius flag color indicators */}
                <div className="flex space-x-1 mt-6 pt-4 border-t border-gray-200">
                  <div className="w-full h-1 bg-red-600 rounded-full"></div>
                  <div className="w-full h-1 bg-blue-800 rounded-full"></div>
                  <div className="w-full h-1 bg-yellow-500 rounded-full"></div>
                  <div className="w-full h-1 bg-green-600 rounded-full"></div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1 mt-4">
                  <p>✓ Confirmation sent to email</p>
                  <p>✓ Free cancellation (24hrs)</p>
                  <p>✓ Includes all passengers</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirportTransferBookingForm;