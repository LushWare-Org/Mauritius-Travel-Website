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

  // Get booking data from location state
  const {
    selectedDate,
    guests,
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

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  // Generate booking reference
  const generateBookingReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `BOOK-${timestamp}-${random}`;
  };

  // Fetch activity details
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const response = await fetch(`${baseUrl}/activities/${id}`);
        const data = await response.json();

        if (data.success) {
          setActivity(data.data);
        } else {
          setError('Activity not found');
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  // Fetch airport transfer - also use fetch for consistency
  useEffect(() => {
    if (includeAirportTransfer && airportTransferId) {
      const fetchAirportTransfer = async () => {
        try {
          const baseUrl =
            import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
          const response = await fetch(
            `${baseUrl}/airport-transfers/${airportTransferId}`
          );
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

  // Pre-fill user data if logged in
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    return true;
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!selectedDate) {
      setError('Please select a date for your booking');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Generate booking reference
      const bookingReference = generateBookingReference();

      // 1. Create activity booking
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
        phone: formData.phone,
        specialRequests: formData.specialRequests,
      };

      console.log('Creating activity booking:', bookingData);

      // Create activity booking
      const bookingResponse = await bookingsAPI.create(bookingData);

      if (!bookingResponse.data.success) {
        throw new Error(
          bookingResponse.data.error || 'Failed to create activity booking'
        );
      }

      const activityBookingId = bookingResponse.data.data._id;
      const activityBookingReference =
        bookingResponse.data.data.bookingReference;

      // 2. If airport transfer is included, create that booking too
      let airportTransferBookingReference = null;

      if (includeAirportTransfer && airportTransferId && airportTransfer) {
        const airportTransferData = {
          transfer: airportTransferId,
          guestName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          flightNumber: '', // Can be added as a field
          arrivalDate: selectedDate,
          arrivalTime: '12:00', // Default time
          tripType: airportTransferType,
          transferType: 'airport-to-hotel',
          passengers: guests,
          specialRequests: `Linked to activity booking: ${activityBookingReference}\n${formData.specialRequests}`,
          totalPrice: airportTransferPrice,
        };

        console.log('Creating airport transfer booking:', airportTransferData);

        const transferResponse = await airportTransferBookingAPI.createBooking(
          airportTransferData
        );

        if (transferResponse.data.success) {
          airportTransferBookingReference =
            transferResponse.data.data.bookingReference;
          console.log(
            '✅ Airport transfer booking created:',
            airportTransferBookingReference
          );
        } else {
          console.warn(
            '⚠️ Airport transfer booking failed, but activity booking succeeded'
          );
        }
      }

      // 3. Navigate to confirmation
      navigate('/dashboard/bookings', {
        state: {
          bookingSuccess: true,
          bookingReference: activityBookingReference,
          airportTransferBookingReference: airportTransferBookingReference,
          includeAirportTransfer: includeAirportTransfer,
          totalAmount:
            selectedPrice * guests +
            (includeAirportTransfer ? airportTransferPrice : 0),
        },
      });
    } catch (err) {
      console.error('Booking error:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to complete booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!activity)
    return <div className="text-center py-12">Activity not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">
          Complete Your Booking
        </h1>
        <p className="text-gray-600">
          Please fill in your details to complete the booking
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Booking Summary
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-lg overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-gray-800">
                      {activity.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span>
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span>
                        {guests} {guests === 1 ? 'guest' : 'guests'}
                      </span>
                      {selectedDuration && (
                        <span className="ml-2">
                          •{' '}
                          {selectedDuration === 'halfDay'
                            ? 'Half Day'
                            : 'Full Day'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      ${selectedPrice * guests}
                    </div>
                  </div>
                </div>

                {/* Airport Transfer Summary */}
                {includeAirportTransfer && airportTransfer && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-bold text-gray-800">
                          Airport Transfer
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>
                            {airportTransfer.airportName} (
                            {airportTransfer.airportCode})
                          </div>
                          <div className="capitalize">
                            {airportTransfer.vehicleType} •{' '}
                            {airportTransferType === 'one-way'
                              ? 'One Way'
                              : 'Round Trip'}
                          </div>
                          <div>Airport → Hotel</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${airportTransferPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-blue-800">
                      $
                      {selectedPrice * guests +
                        (includeAirportTransfer ? airportTransferPrice : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Email Address *
                    </label>
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
                    <label className="block text-gray-700 font-medium mb-2">
                      Phone Number *
                    </label>
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

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    rows="4"
                    placeholder="Any special requirements, dietary restrictions, accessibility needs, etc."
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 mr-3"
                />
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the Terms & Conditions and Privacy Policy. I
                  understand that my booking is subject to availability and
                  confirmation. Cancellation policy applies.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`
                w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300
                flex items-center justify-center
                ${
                  !submitting
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                    : 'bg-blue-400 text-white cursor-not-allowed'
                }
              `}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing Booking...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar - Help & Information */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md border sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Need Help?
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-800">24/7 Support</h4>
                  <p className="text-sm text-gray-600">
                    Call us at +960 123 4567
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-green-100 p-2 rounded-full">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-800">Secure Booking</h4>
                  <p className="text-sm text-gray-600">
                    Your information is protected
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-yellow-100 p-2 rounded-full">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-medium text-gray-800">
                    Free Cancellation
                  </h4>
                  <p className="text-sm text-gray-600">
                    Cancel up to 24 hours before
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-2">
                  What to Expect
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Confirmation email within 2 hours</li>
                  <li>• Detailed itinerary before arrival</li>
                  <li>• Professional guides & equipment</li>
                  <li>• Safety briefing included</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingRequest;
