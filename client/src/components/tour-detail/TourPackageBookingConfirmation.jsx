// Update your TourPackageBookingConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tourPackageBookingsAPI } from '../../utils/api';

const TourPackageBookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: tourId } = useParams();
  const { currentUser } = useAuth();

  const {
    selectedDate,
    guests,
    selectedActivities = [],
    includeTransfer = false,
    transferDetails = null,
    totalPrice: initialTotalPrice,
    basePrice,
    activitiesTotal = 0,
    transferTotal = 0,
  } = location.state || {};

  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    countryCode: '+230',
    phone: currentUser?.phone || '',
    specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedPrices, setCalculatedPrices] = useState(null);

  // If no state data, redirect back
  if (!selectedDate) {
    navigate(-1);
    return null;
  }

  // Calculate prices on component mount
  useEffect(() => {
    const calculatePrices = () => {
      console.log('=== CALCULATING PRICES (Rs only) ===');

      // Ensure basePrice is a number
      const basePriceNum = parseFloat(basePrice) || 0;
      const guestsNum = parseInt(guests) || 1;

      // Calculate package total
      const packageTotal = basePriceNum * guestsNum;
      console.log(
        'Package total:',
        basePriceNum,
        '×',
        guestsNum,
        '=',
        packageTotal
      );

      // Calculate activities total
      const activitiesTotal = selectedActivities.reduce((sum, activity) => {
        const activityPrice = parseFloat(activity.price) || 0;
        const activityTotal = activityPrice * guestsNum;
        console.log(
          `Activity "${activity.title}": Rs ${activityPrice} × ${guestsNum} = Rs ${activityTotal}`
        );
        return sum + activityTotal;
      }, 0);
      console.log('Activities total:', activitiesTotal);

      // Calculate transfer total
      const transferTotal =
        includeTransfer && transferDetails
          ? parseFloat(transferDetails.transferPrice) || 0
          : 0;
      console.log('Transfer total:', transferTotal);

      // Calculate grand total in Rs
      const grandTotal = packageTotal + activitiesTotal + transferTotal;
      console.log(
        'Grand total (Rs):',
        packageTotal,
        '+',
        activitiesTotal,
        '+',
        transferTotal,
        '=',
        grandTotal
      );

      setCalculatedPrices({
        packageTotal,
        activitiesTotal,
        transferTotal,
        grandTotal,
        formattedGrandTotal: parseFloat(grandTotal.toFixed(2)),
      });
    };

    if (basePrice && guests) {
      calculatePrices();
    }
  }, [basePrice, guests, selectedActivities, includeTransfer, transferDetails]);

  // In handleSubmit, send Rs values directly
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Build booking data with Rs values
      const bookingData = {
        tourPackage: tourId,
        user: currentUser._id,
        guests: parseInt(guests),
        startDate: new Date(selectedDate).toISOString().split('T')[0],
        fullName: formData.fullName || currentUser.name,
        email: formData.email || currentUser.email,
        phone: `${formData.countryCode}${formData.phone}`,

        // Send Rs values directly
        totalPrice: calculatedPrices?.grandTotal || 0,
        packagePrice: parseFloat(basePrice) || 0,
        activitiesTotal: calculatedPrices?.activitiesTotal || 0,
        transferTotal: calculatedPrices?.transferTotal || 0,

        specialRequests: formData.specialRequests || '',
        status: 'pending',
        bookingDate: new Date().toISOString().split('T')[0],
        currency: 'MUR', // Send currency explicitly
      };

      console.log('=== FINAL PAYLOAD (Rs) ===');
      console.log('Total Price (Rs):', bookingData.totalPrice);
      console.log('Package Price (Rs):', bookingData.packagePrice);
      console.log('Activities Total (Rs):', bookingData.activitiesTotal);
      console.log('Transfer Total (Rs):', bookingData.transferTotal);

      // Activities data in Rs
      if (selectedActivities && selectedActivities.length > 0) {
        bookingData.selectedActivities = selectedActivities.map((act) => ({
          activity: act._id || act.activity,
          title: act.title,
          price: Number(act.price) || 0, // Keep as Rs
          quantity: parseInt(guests),
        }));
      } else {
        bookingData.selectedActivities = [];
      }

      // Transfer data in Rs
      if (includeTransfer && transferDetails) {
        bookingData.airportTransfer = {
          transferId: transferDetails.transferId || transferDetails._id,
          transferName: transferDetails.transferName,
          transferCode: transferDetails.transferCode,
          vehicleType: transferDetails.vehicleType,
          tripType: transferDetails.tripType,
          transferType: transferDetails.transferType,
          arrivalDate: transferDetails.arrivalDate,
          arrivalTime: transferDetails.arrivalTime,
          departureDate: transferDetails.departureDate || '',
          departureTime: transferDetails.departureTime || '',
          transferPrice: calculatedPrices?.transferTotal || 0, // Keep as Rs
        };
      }

      // Make API call
      const response = await tourPackageBookingsAPI.createWithActivities(
        bookingData
      );

      if (response.data.success) {
        navigate('/dashboard/tour-package-bookings', {
          state: {
            bookingReference: response.data.data.bookingReference,
            success: true,
          },
        });
      } else {
        setError(response.data.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // If prices aren't calculated yet, show loading
  if (!calculatedPrices) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Calculating prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Complete Your Booking
      </h1>
      <p className="text-gray-600 mb-8">
        Review your selection and fill in your details
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Booking Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Booking Summary
            </h2>

            {/* Tour Package Details */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="font-medium text-gray-700 mb-2">Tour Package</h3>
              <div className="flex justify-between">
                <span>
                  Rs {basePrice} × {guests} guests
                </span>
                <span className="font-medium">
                  Rs {calculatedPrices.packageTotal}
                </span>
              </div>
            </div>

            {/* Selected Activities */}
            {selectedActivities && selectedActivities.length > 0 && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-medium text-gray-700 mb-3">
                  Selected Activities
                </h3>
                <div className="space-y-3">
                  {selectedActivities.map((activity, index) => (
                    <div
                      key={activity._id || index}
                      className="flex justify-between"
                    >
                      <div>
                        <span className="block">{activity.title}</span>
                        <span className="text-sm text-gray-500">
                          Rs {activity.price} × {guests} guests
                        </span>
                      </div>
                      <span className="font-medium">
                        Rs {parseFloat(activity.price) * guests}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Airport Transfer Details */}
            {includeTransfer && transferDetails && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-medium text-gray-700 mb-3">
                  Airport Transfer
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <span className="block font-medium">
                        {transferDetails.transferName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {transferDetails.vehicleType} •{' '}
                        {transferDetails.transferCode}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {transferDetails.tripType === 'one-way'
                          ? 'One Way'
                          : 'Round Trip'}{' '}
                        •
                        {transferDetails.transferType === 'airport-to-hotel'
                          ? ' Airport → Hotel'
                          : ' Hotel → Airport'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Arrival: {transferDetails.arrivalDate} at{' '}
                        {transferDetails.arrivalTime}
                        {transferDetails.departureDate && (
                          <span>
                            {' '}
                            • Departure: {transferDetails.departureDate} at{' '}
                            {transferDetails.departureTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-medium">
                      Rs {transferDetails.transferPrice}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Total Price */}
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-lg font-semibold text-gray-800">
                Total Amount (Rs)
              </span>
              <span className="text-2xl font-bold text-blue-600">
                Rs {calculatedPrices.grandTotal}
              </span>
            </div>
            {/*<div className="flex justify-between items-center pt-2 mt-2 border-t">
              <span className="text-sm text-gray-600">Equivalent in USD (for backend)</span>
              <span className="text-lg font-semibold text-green-600">${calculatedPrices.inUSD}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600">Backend expects</span>
              <span className="text-lg font-semibold text-red-600">${calculatedPrices.expectedBackendUSD}</span>
            </div>*/}
            {Math.abs(
              calculatedPrices.inUSD - calculatedPrices.expectedBackendUSD
            ) > 0.01 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-700">
                  ⚠️ Price mismatch detected! Frontend calculates $
                  {calculatedPrices.inUSD}, but backend expects $
                  {calculatedPrices.expectedBackendUSD}.
                </p>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Your Details
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Phone Number *
                </label>

                <div className="flex gap-2">
                  {/* Country Code */}
                  <input
                    type="text"
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value })
                    }
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />

                  {/* Local Number */}
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requirements or requests..."
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {/*<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> The backend expects a total of <strong>$244.00</strong>. 
                  We're sending this amount to match the backend's expectation, even though 
                  our calculation shows ${calculatedPrices?.inUSD}.
                </p>
              </div>*/}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Booking Details */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Booking Details
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">{guests} people</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Activities:</span>
                <span className="font-medium">
                  {selectedActivities?.length || 0} selected
                </span>
              </div>
              {includeTransfer && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Airport Transfer:</span>
                  <span className="font-medium text-green-600">Included</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Package Total:</span>
                <span className="font-medium">
                  Rs {calculatedPrices.packageTotal}
                </span>
              </div>
              {calculatedPrices.activitiesTotal > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Activities Total:</span>
                  <span className="font-medium">
                    Rs {calculatedPrices.activitiesTotal}
                  </span>
                </div>
              )}
              {calculatedPrices.transferTotal > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Transfer Total:</span>
                  <span className="font-medium">
                    Rs {calculatedPrices.transferTotal}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total (Rs):</span>
                <span className="text-blue-600">
                  Rs {calculatedPrices.grandTotal}
                </span>
              </div>
              {/*<div className="flex justify-between text-sm pt-2 mt-2 border-t">
                <span className="text-gray-600">Sending to backend:</span>
                <span className="font-medium text-green-600">$244.00</span>
              </div>*/}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourPackageBookingConfirmation;
