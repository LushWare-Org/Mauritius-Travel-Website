import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsAPI, airportTransferBookingAPI } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BookingRequest = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { currentUser } = useAuth();

  const {
    selectedDate,
    guests = 1,
    selectedDuration,
    selectedPrice,
    includeAirportTransfer,
    airportTransferId,
    airportTransferType,
    airportTransferPrice,
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState(null);
  const [airportTransfer, setAirportTransfer] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+230',
    specialRequests: '',
  });

  const countryCodes = [
    { code: '+230', name: 'Mauritius', flag: '🇲🇺' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+27', name: 'South Africa', flag: '🇿🇦' },
    { code: '+254', name: 'Kenya', flag: '🇰🇪' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  ];

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const response = await fetch(`${baseUrl}/activities/${id}`);
        const data = await response.json();

        if (data.success) {
          setActivity(data.data);
        } else {
          setError('Activity not found');
        }
      } catch (err) {
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  useEffect(() => {
    if (includeAirportTransfer && airportTransferId) {
      const fetchAirportTransfer = async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
          const response = await fetch(`${baseUrl}/airport-transfers/${airportTransferId}`);
          const data = await response.json();

          if (data.success) {
            setAirportTransfer(data.data);
          }
        } catch (err) {
          console.error('Error fetching airport transfer:', err);
        }
      };

      fetchAirportTransfer();
    }
  }, [includeAirportTransfer, airportTransferId]);

  useEffect(() => {
    if (currentUser) {
      let phoneNumber = currentUser.phone || '';
      let countryCode = '+230';
      
      if (phoneNumber.startsWith('+')) {
        const match = phoneNumber.match(/^(\+\d+)/);
        if (match) {
          countryCode = match[1];
          phoneNumber = phoneNumber.replace(countryCode, '').trim();
        }
      }

      setFormData((prev) => ({
        ...prev,
        fullName: currentUser.name || '',
        email: currentUser.email || '',
        phone: phoneNumber,
        countryCode: countryCode,
      }));
    }
  }, [currentUser]);

  const generateBookingReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BOOK-${timestamp}-${random}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (currentUser && name === 'email') return;
    
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCountryCodeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      countryCode: e.target.value,
    }));
  };

  const getFullPhoneNumber = () => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    return `${formData.countryCode}${phoneDigits}`;
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setError('Please enter a valid phone number (minimum 8 digits)');
      return false;
    }

    return true;
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const bookingReference = generateBookingReference();
      const fullPhoneNumber = getFullPhoneNumber();

      const bookingData = {
        activityId: id,
        bookingReference: bookingReference,
        date: selectedDate,
        guests: guests,
        durationType: selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day',
        pricePerPerson: selectedPrice,
        totalPrice: selectedPrice * guests,
        fullName: formData.fullName,
        email: formData.email,
        phone: fullPhoneNumber,
        countryCode: formData.countryCode,
        specialRequests: formData.specialRequests,
      };

      const bookingResponse = await bookingsAPI.create(bookingData);

      if (!bookingResponse.data.success) {
        throw new Error(bookingResponse.data.error || 'Failed to create booking');
      }

      const activityBookingId = bookingResponse.data.data._id;
      const activityBookingReference = bookingResponse.data.data.bookingReference;

      let airportTransferBookingReference = null;

      if (includeAirportTransfer && airportTransferId && airportTransfer) {
        const airportTransferData = {
          transfer: airportTransferId,
          guestName: formData.fullName,
          email: formData.email,
          phone: fullPhoneNumber,
          countryCode: formData.countryCode,
          flightNumber: '',
          arrivalDate: selectedDate,
          arrivalTime: '12:00',
          tripType: airportTransferType,
          transferType: 'airport-to-hotel',
          passengers: guests,
          specialRequests: `Linked to activity: ${activityBookingReference}\n${formData.specialRequests}`,
          totalPrice: airportTransferPrice,
        };

        const transferResponse = await airportTransferBookingAPI.createBooking(airportTransferData);

        if (transferResponse.data.success) {
          airportTransferBookingReference = transferResponse.data.data.bookingReference;
        }
      }

      navigate('/dashboard/bookings', {
        state: {
          bookingSuccess: true,
          bookingReference: activityBookingReference,
          airportTransferBookingReference: airportTransferBookingReference,
          includeAirportTransfer: includeAirportTransfer,
          totalAmount: selectedPrice * guests + (includeAirportTransfer ? airportTransferPrice : 0),
        },
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to complete booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Activity Not Found</h3>
          <p className="text-gray-600">The activity you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const totalAmount = selectedPrice * guests + (includeAirportTransfer ? airportTransferPrice : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-blue-50/20 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Booking</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Please provide your details to confirm this amazing experience
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Oops! Something went wrong</h3>
                  <p className="text-gray-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Summary</h2>
              </div>

              <div className="space-y-6">
                {/* Activity Details */}
                <div className="group bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 transition-all">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={activity.image}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="ml-6 flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>{guests} {guests === 1 ? 'guest' : 'guests'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 01118 0z" />
                          </svg>
                          <span>{selectedDuration === 'halfDay' ? 'Half Day (4-5 hours)' : 'Full Day (8-9 hours)'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">${selectedPrice * guests}</div>
                      <div className="text-sm text-gray-500 mt-1">Activity total</div>
                    </div>
                  </div>
                </div>

                {/* Airport Transfer Details */}
                {includeAirportTransfer && airportTransfer && (
                  <div className="group bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:border-green-200 transition-all">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-6 flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Airport Transfer</h3>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{airportTransfer.airportName} ({airportTransfer.airportCode})</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{airportTransferType === 'one-way' ? 'One Way Transfer' : 'Round Trip Transfer'}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{airportTransfer.vehicleType} • Up to {airportTransfer.capacity} people</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">${airportTransferPrice}</div>
                        <div className="text-sm text-gray-500 mt-1">Transfer total</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Amount */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">Total Amount</div>
                      <div className="text-gray-600 mt-1">All inclusive • Secure payment</div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                        ${totalAmount}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Final price</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-8">
                {/* Full Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Email */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!currentUser}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 ${
                        currentUser 
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200' 
                          : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                      }`}
                      placeholder="your@email.com"
                      required
                    />
                    {currentUser && (
                      <div className="mt-2 text-sm text-blue-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Linked to your account
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone Number
                    </label>
                    <div className="flex gap-4">
                      <div className="relative flex-1 max-w-[160px]">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleCountryCodeChange}
                          className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                        >
                          {countryCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.code}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300"
                          placeholder="Your phone number"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your number: {getFullPhoneNumber()}
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300 resize-none"
                    rows="4"
                    placeholder="Any special requirements, dietary needs, or additional information..."
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="group bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="mt-1 mr-4 w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="terms" className="text-gray-700">
                      <span className="font-medium text-gray-900">I agree to the Terms & Conditions and Privacy Policy.</span>
                      <p className="text-sm text-gray-600 mt-2">
                        By proceeding, you acknowledge that you've read and agree to our booking policies, 
                        including cancellation terms and privacy practices.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-5 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center">
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing Your Booking...
                      </>
                    ) : (
                      <>
                        Confirm & Secure Booking
                        <svg className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Why Book With Us */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Why Book With Us</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Payment</h4>
                    <p className="text-gray-600 text-sm mt-1">Bank-level encryption for your safety</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">24/7 Support</h4>
                    <p className="text-gray-600 text-sm mt-1">Always here to help you</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Flexible Cancellation</h4>
                    <p className="text-gray-600 text-sm mt-1">Free cancellation 24h before</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Instant Confirmation</h4>
                    <p className="text-gray-600 text-sm mt-1">Receive details immediately</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="my-8">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>

              {/* Additional Perks */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">What's Included</h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Professional guides & equipment
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Safety briefing & insurance
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Detailed itinerary & photos
                  </li>
                </ul>
              </div>
            </div>

            {/* Need Help */}
          <div class="bg-blue-100 border border-white rounded-2xl p-8 text-">
              <h3 className="text-xl font-bold mb-4">Need Help?</h3>
              <p className="opacity-90 mb-6">Our team is here to assist you</p>
              
              <div className="space-y-4">
                <a 
                  href="tel:+23051234567" 
                  className="flex items-center p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Call Us</div>
                    <div className="text-sm opacity-80">+2307</div>
                  </div>
                </a>

                <a 
                  href="mailto:support@aquaexcursions.com" 
                  className="flex items-center p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Email Us</div>
                    <div className="text-sm opacity-80">support@email.com</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS animation
const style = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
`;

export default BookingRequest;