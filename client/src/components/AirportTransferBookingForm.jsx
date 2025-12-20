import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  airportTransferAPI,
  airportTransferBookingAPI,
} from '../utils/airportTransferApi';
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
  const [countryCode, setCountryCode] = useState('+230');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currency, setCurrency] = useState('MUR'); // Default to MUR

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
    specialRequests: '',
    selectedCurrency: 'MUR', // Store selected currency in booking
  });

  // Country codes for dropdown
  const countryCodes = [
    { code: '+230', name: 'Mauritius', flag: '🇲🇺' },
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
      setFormData((prev) => ({
        ...prev,
        guestName: currentUser.name || '',
        email: currentUser.email || '',
      }));

      // If user has phone, try to parse country code
      if (currentUser.phone) {
        const phone = currentUser.phone.trim();
        // Check if phone starts with a known country code
        const foundCode = countryCodes.find((code) =>
          phone.startsWith(code.code)
        );
        if (foundCode) {
          setCountryCode(foundCode.code);
          setPhoneNumber(phone.replace(foundCode.code, '').trim());
          setFormData((prev) => ({ ...prev, phone }));
        } else {
          // Default to +230 (Mauritius) and use whole phone
          setPhoneNumber(phone);
          setFormData((prev) => ({ ...prev, phone: `+230${phone}` }));
        }
      }
    }
  }, [id, currentUser]);

  useEffect(() => {
    // Update formData.phone whenever countryCode or phoneNumber changes
    const fullPhone = phoneNumber.trim()
      ? `${countryCode}${phoneNumber.trim()}`
      : '';
    setFormData((prev) => ({ ...prev, phone: fullPhone }));
  }, [countryCode, phoneNumber]);

  useEffect(() => {
    // Update formData with selected currency
    setFormData(prev => ({
      ...prev,
      selectedCurrency: currency
    }));
  }, [currency]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  const getPrice = () => {
    if (!transfer) return { price: 0, currencySymbol: '' };

    let price = 0;
    let currencySymbol = currency === 'MUR' ? 'Rs ' : '€';

    if (currency === 'MUR') {
      price = formData.tripType === 'one-way' 
        ? (transfer.oneWayPriceMUR || transfer.oneWayPrice || 0)
        : (transfer.roundTripPriceMUR || transfer.roundTripPrice || 0);
    } else {
      price = formData.tripType === 'one-way'
        ? (transfer.oneWayPriceEUR || (transfer.oneWayPrice ? transfer.oneWayPrice / (transfer.exchangeRate || 40) : 0))
        : (transfer.roundTripPriceEUR || (transfer.roundTripPrice ? transfer.roundTripPrice / (transfer.exchangeRate || 40) : 0));
    }

    return { price: parseFloat(price) || 0, currencySymbol };
  };

const calculateTotal = () => {
  if (!transfer) return 0;

  let total = 0;
  
  if (currency === 'MUR') {
    total = formData.tripType === 'one-way' 
      ? parseFloat(transfer.oneWayPriceMUR) || 0
      : parseFloat(transfer.roundTripPriceMUR) || 0;
  } else {
    total = formData.tripType === 'one-way'
      ? parseFloat(transfer.oneWayPriceEUR) || 0
      : parseFloat(transfer.roundTripPriceEUR) || 0;
  }

  console.log(`💰 CalculateTotal: ${currency} ${total} (tripType: ${formData.tripType})`);
  return total;
};

  const getAlternativePrice = () => {
    if (!transfer) return { price: 0, currencySymbol: '' };

    const altCurrency = currency === 'MUR' ? 'EUR' : 'MUR';
    let price = 0;
    let currencySymbol = altCurrency === 'MUR' ? 'Rs ' : '€';

    if (altCurrency === 'MUR') {
      price = formData.tripType === 'one-way' 
        ? (transfer.oneWayPriceMUR || transfer.oneWayPrice || 0)
        : (transfer.roundTripPriceMUR || transfer.roundTripPrice || 0);
    } else {
      price = formData.tripType === 'one-way'
        ? (transfer.oneWayPriceEUR || (transfer.oneWayPrice ? transfer.oneWayPrice / (transfer.exchangeRate || 40) : 0))
        : (transfer.roundTripPriceEUR || (transfer.roundTripPrice ? transfer.roundTripPrice / (transfer.exchangeRate || 40) : 0));
    }

    return { price: parseFloat(price) || 0, currencySymbol };
  };

  const validateForm = () => {
    const requiredFields = [
      { field: formData.guestName.trim(), message: 'Please enter your name' },
      { field: formData.email.trim(), message: 'Please enter your email' },
      {
        field: formData.phone.trim(),
        message: 'Please enter your phone number',
      },
      { field: formData.arrivalDate, message: 'Please select arrival date' },
      { field: formData.arrivalTime, message: 'Please select arrival time' },
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
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
      
      // Validate departure date is after arrival date
      const arrival = new Date(`${formData.arrivalDate}T${formData.arrivalTime}`);
      const departure = new Date(`${formData.departureDate}T${formData.departureTime}`);
      if (departure <= arrival) {
        setError('Departure must be after arrival');
        return false;
      }
    }

    return true;
  };

// In handleSubmit function, update the bookingData section:

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  setSubmitting(true);
  setError('');

  try {
    // First, log all transfer data to debug
    console.log('🔍 Transfer data for calculation:', {
      transfer: transfer,
      oneWayPriceMUR: transfer?.oneWayPriceMUR,
      roundTripPriceMUR: transfer?.roundTripPriceMUR,
      oneWayPriceEUR: transfer?.oneWayPriceEUR,
      roundTripPriceEUR: transfer?.roundTripPriceEUR,
      oneWayPrice: transfer?.oneWayPrice,
      roundTripPrice: transfer?.roundTripPrice,
      currency: currency,
      tripType: formData.tripType
    });

    // Calculate total price with better error handling
    let totalPrice = 0;
    
    if (currency === 'MUR') {
      if (formData.tripType === 'one-way') {
        totalPrice = parseFloat(transfer?.oneWayPriceMUR) || 
                    parseFloat(transfer?.oneWayPrice) || 0;
      } else {
        totalPrice = parseFloat(transfer?.roundTripPriceMUR) || 
                    parseFloat(transfer?.roundTripPrice) || 0;
      }
    } else {
      if (formData.tripType === 'one-way') {
        totalPrice = parseFloat(transfer?.oneWayPriceEUR) || 0;
      } else {
        totalPrice = parseFloat(transfer?.roundTripPriceEUR) || 0;
      }
    }

    console.log('💰 Calculated totalPrice:', totalPrice);

    // Validate pricing
    if (isNaN(totalPrice) || totalPrice <= 0) {
      console.error('❌ Invalid totalPrice:', totalPrice);
      setError(`Invalid transfer pricing. Price is ${totalPrice}. Please contact support.`);
      setSubmitting(false);
      return;
    }

    // Get other price fields for backup
    const oneWayPriceMUR = parseFloat(transfer?.oneWayPriceMUR) || 0;
    const roundTripPriceMUR = parseFloat(transfer?.roundTripPriceMUR) || 0;
    const oneWayPriceEUR = parseFloat(transfer?.oneWayPriceEUR) || 0;
    const roundTripPriceEUR = parseFloat(transfer?.roundTripPriceEUR) || 0;

    // Prepare booking data - simplified version with ONLY required fields
    const bookingData = {
      transfer: id,
      guestName: formData.guestName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      arrivalDate: new Date(formData.arrivalDate).toISOString(), // Convert to ISO string
      arrivalTime: formData.arrivalTime,
      tripType: formData.tripType,
      transferType: formData.transferType,
      passengers: parseInt(formData.passengers) || 1,
      
      // CRITICAL: Ensure totalPrice is a valid number
      totalPrice: parseFloat(totalPrice.toFixed(2)), // Round to 2 decimal places
      
      // Optional fields
      flightNumber: formData.flightNumber?.trim() || '',
      departureDate: formData.departureDate ? new Date(formData.departureDate).toISOString() : null,
      departureTime: formData.departureTime || '',
      specialRequests: formData.specialRequests?.trim() || '',
      
      // If user is logged in, include their ID
      user: currentUser?._id || null
    };

    console.log('📦 Final booking data being sent:', bookingData);
    console.log('✅ totalPrice in bookingData:', bookingData.totalPrice, 'Type:', typeof bookingData.totalPrice);

    const response = await airportTransferBookingAPI.createBooking(bookingData);

    if (response.data.success) {
      console.log('✅ Booking created successfully:', response.data.data);
      // Success navigation
      navigate('/dashboard/airport-transfers', {
        state: {
          bookingSuccess: true,
          bookingReference: response.data.data.bookingReference,
        },
      });
    } else {
      setError(response.data.error || 'Failed to create booking');
    }
  } catch (err) {
    console.error('❌ Booking error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      config: err.config?.data // Log what was actually sent
    });
    
    const errorMessage = err.response?.data?.error || 
                        err.response?.data?.message || 
                        'Failed to create booking. Please try again.';
    setError(errorMessage);
  } finally {
    setSubmitting(false);
  }
};
  if (loading) return <LoadingSpinner />;

  const { price, currencySymbol } = getPrice();
  const altPrice = getAlternativePrice();

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          Book Airport Transfer
        </h1>
        <p className="text-gray-600 text-lg">Secure your comfortable transfer to your destination</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Transfer Selection */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Transfer Service
              </h2>

              {transfer && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className="w-4 h-4 bg-blue-800 rounded-full mr-3 mt-1 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-blue-900">{transfer.airportName}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {transfer.airportCode}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {transfer.capacity} passengers
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {transfer.estimatedTime}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {transfer.vehicleType.charAt(0).toUpperCase() + transfer.vehicleType.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-3 text-sm font-medium">
                    <svg className="w-4 h-4 inline mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Trip Type
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          name="tripType"
                          value="one-way"
                          checked={formData.tripType === 'one-way'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 ${formData.tripType === 'one-way' ? 'border-blue-600' : 'border-gray-300'} flex items-center justify-center`}>
                          {formData.tripType === 'one-way' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-700">One Way</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          name="tripType"
                          value="round-trip"
                          checked={formData.tripType === 'round-trip'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 ${formData.tripType === 'round-trip' ? 'border-blue-600' : 'border-gray-300'} flex items-center justify-center`}>
                          {formData.tripType === 'round-trip' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-700">Round Trip</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-3 text-sm font-medium">
                    <svg className="w-4 h-4 inline mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    Transfer Direction
                  </label>
                  <select
                    name="transferType"
                    value={formData.transferType}
                    onChange={handleInputChange}
                    className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="airport-to-hotel">Airport to Hotel</option>
                    <option value="hotel-to-airport">Hotel to Airport</option>
                    <option value="both">Round Trip (Airport-Hotel-Airport)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Phone Number *
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={countryCode}
                      onChange={handleCountryCodeChange}
                      className="w-48 p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code} ({country.name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      className="flex-1 p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                    Complete number: <span className="font-mono">{formData.phone || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flight Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Flight Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Flight Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleInputChange}
                    className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="EK650, UL403, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                      Arrival Date *
                    </label>
                    <input
                      type="date"
                      name="arrivalDate"
                      value={formData.arrivalDate}
                      onChange={handleInputChange}
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                      Arrival Time *
                    </label>
                    <input
                      type="time"
                      name="arrivalTime"
                      value={formData.arrivalTime}
                      onChange={handleInputChange}
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {formData.tripType === 'round-trip' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">
                          Departure Date *
                        </label>
                        <input
                          type="date"
                          name="departureDate"
                          value={formData.departureDate}
                          onChange={handleInputChange}
                          className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          min={formData.arrivalDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">
                          Departure Time *
                        </label>
                        <input
                          type="time"
                          name="departureTime"
                          value={formData.departureTime}
                          onChange={handleInputChange}
                          className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-yellow-700">
                          Round trip includes both airport pick-up and drop-off at the same price. 
                          The driver will be waiting for you on both occasions.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Passengers and Special Requests */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Additional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">
                    Number of Passengers *
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(formData.passengers) || 1;
                        if (current > 1) {
                          setFormData(prev => ({ ...prev, passengers: current - 1 }));
                        }
                      }}
                      className="w-10 h-10 rounded-l-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      name="passengers"
                      value={formData.passengers}
                      onChange={handleInputChange}
                      className="flex-1 h-10 border-t border-b border-gray-300 text-center"
                      min="1"
                      max={transfer?.capacity || 10}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const current = parseInt(formData.passengers) || 1;
                        const maxCapacity = transfer?.capacity || 10;
                        if (current < maxCapacity) {
                          setFormData(prev => ({ ...prev, passengers: current + 1 }));
                        }
                      }}
                      className="w-10 h-10 rounded-r-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum capacity: {transfer?.capacity || 'Not specified'} passengers
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-gray-700 mb-2 text-sm font-medium">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  className="w-full p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Any special requirements, wheelchair access, child seats, excess luggage, hotel room number, etc."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !transfer}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Booking...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Book Now - {currencySymbol}{calculateTotal().toFixed(2)}
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-lg border border-blue-100 sticky top-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6 pb-3 border-b border-blue-200 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Booking Summary
            </h2>

            {transfer && (
              <div className="space-y-6">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 font-medium">Transfer Service:</span>
                    <span className="font-bold text-blue-900">{transfer.airportName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600 font-medium">Trip Type:</span>
                    <span className="font-medium capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {formData.tripType.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Vehicle:</span>
                    <span className="font-medium capitalize text-blue-900">
                      {transfer.vehicleType.charAt(0).toUpperCase() + transfer.vehicleType.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  {/* Currency Selector */}
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2 text-sm font-medium">
                      Display Price In:
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setCurrency('MUR')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${currency === 'MUR' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        MUR (Rs)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('EUR')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${currency === 'EUR' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        EUR (€)
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-700">Price per trip:</span>
                      <div className="text-right">
                        <span className="font-bold text-lg text-blue-900">
                          {currencySymbol}{price.toFixed(2)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          ≈ {altPrice.currencySymbol}{altPrice.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-blue-700 mb-4 bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Flat rate for up to {transfer.capacity} passengers. Includes all taxes and fees.</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xl pt-4 border-t border-gray-200">
                      <span className="text-blue-900 font-bold">Total Amount:</span>
                      <span className="text-blue-900 font-extrabold text-2xl">
                        {currencySymbol}{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    What's Included
                  </h3>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Meet & greet at airport/hotel
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Bottled water included
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Free waiting time (30 mins)
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      All taxes and parking fees
                    </li>
                  </ul>
                </div>

                {/* Cancellation Policy */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.242 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Cancellation Policy
                  </h3>
                  <p className="text-sm text-amber-700">
                    Free cancellation up to 24 hours before pickup. No refund for cancellations within 24 hours.
                  </p>
                </div>

                {/* Mauritius Flag */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-full h-2 bg-red-600 rounded-full"></div>
                    <div className="w-full h-2 bg-blue-800 rounded-full"></div>
                    <div className="w-full h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-full h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Proudly serving Mauritius 🇲🇺
                  </p>
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