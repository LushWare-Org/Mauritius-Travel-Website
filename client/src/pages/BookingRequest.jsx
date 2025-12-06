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
    countryCode: '+230', // Mauritius country code as default
    specialRequests: '',
  });

  const generateBookingReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BOOK-${timestamp}-${random}`;
  };

  // Common country codes
  const countryCodes = [
    { code: '+230', name: 'Mauritius 🇲🇺' },
    { code: '+91', name: 'India 🇮🇳' },
    { code: '+44', name: 'UK 🇬🇧' },
    { code: '+33', name: 'France 🇫🇷' },
    { code: '+49', name: 'Germany 🇩🇪' },
    { code: '+1', name: 'USA 🇺🇸' },
    { code: '+61', name: 'Australia 🇦🇺' },
    { code: '+65', name: 'Singapore 🇸🇬' },
    { code: '+971', name: 'UAE 🇦🇪' },
    { code: '+27', name: 'South Africa 🇿🇦' },
    { code: '+254', name: 'Kenya 🇰🇪' },
    { code: '+966', name: 'Saudi Arabia 🇸🇦' },
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
      // Extract country code and phone number from existing phone
      let phoneNumber = currentUser.phone || '';
      let countryCode = '+230'; // Default to Mauritius
      
      // Try to extract country code from existing phone
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Don't allow email change if user is logged in
    if (currentUser && name === 'email') return;
    
    // Validate phone number for digits only (except for country code)
    if (name === 'phone') {
      // Allow only digits for phone number
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

    // Phone validation - at least 8 digits after country code
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

  if (loading) return <LoadingSpinner />;
  if (!activity) return <div className="text-center py-12">Activity not found</div>;

  const totalAmount = selectedPrice * guests + (includeAirportTransfer ? airportTransferPrice : 0);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Complete Booking</h1>
        <p className="text-gray-600">Please fill in your details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-gray-100">
                Booking Summary
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-semibold text-blue-900">{activity.title}</h3>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <div>{new Date(selectedDate).toLocaleDateString()}</div>
                      <div>
                        {guests} {guests === 1 ? 'guest' : 'guests'} • {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-800">${selectedPrice * guests}</div>
                  </div>
                </div>

                {/* Airport Transfer */}
                {includeAirportTransfer && airportTransfer && (
                  <div className="border-t pt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold text-blue-900">Airport Transfer</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>{airportTransfer.airportName} ({airportTransfer.airportCode})</div>
                          <div>{airportTransfer.vehicleType} • {airportTransferType === 'one-way' ? 'One Way' : 'Round Trip'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-700">${airportTransferPrice}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-900">Total</span>
                    <span className="text-xl font-bold text-blue-900">${totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-5 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-gray-100">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!currentUser}
                      className={`w-full p-3 border rounded-lg focus:border-blue-800 ${
                        currentUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                      }`}
                      required
                    />
                    {currentUser && (
                      <p className="text-xs text-gray-500 mt-1">Linked to your account</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Phone</label>
                    <div className="flex">
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleCountryCodeChange}
                        className="w-28 p-3 border border-gray-300 rounded-l-lg focus:border-blue-800 bg-white"
                      >
                        {countryCodes.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} {country.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone number"
                        className="flex-1 p-3 border border-gray-300 border-l-0 rounded-r-lg focus:border-blue-800"
                        required
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Your number: {getFullPhoneNumber()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Special Requests (Optional)</label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-800"
                    rows="3"
                    placeholder="Any special requirements or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 p-5 rounded-lg border">
              <div className="flex items-start">
                <input type="checkbox" id="terms" required className="mt-1 mr-3 text-blue-800" />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the Terms & Conditions and Privacy Policy.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-800 text-white py-4 rounded-lg font-medium hover:bg-blue-900 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Booking Information</h3>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-gray-800">Support</div>
                  <div className="text-sm text-gray-600">24/7 customer service</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-800 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-gray-800">Secure Booking</div>
                  <div className="text-sm text-gray-600">Information protected</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-gray-800">Contact to calcel</div>
                  <div className="text-sm text-gray-600">24 hours before</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600 space-y-1">
                
                  <div>✓ Detailed itinerary included</div>
                  <div>✓ Professional guides & equipment</div>
                </div>
              </div>

              {/* Mauritius flag colors */}
              <div className="flex space-x-1 pt-4 border-t border-gray-100">
                <div className="w-full h-1 bg-red-600 rounded-full"></div>
                <div className="w-full h-1 bg-blue-800 rounded-full"></div>
                <div className="w-full h-1 bg-yellow-500 rounded-full"></div>
                <div className="w-full h-1 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingRequest;