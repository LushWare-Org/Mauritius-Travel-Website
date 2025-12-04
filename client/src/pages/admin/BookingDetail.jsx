import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        const response = await bookingsAPI.getById(id);
        if (response.data.success) {
          console.log('📊 Booking data:', response.data.data);
          setBooking(response.data.data);
        } else {
          setError('Failed to load booking details');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to connect to the server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format timestamp
  const formatTimestamp = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get duration type display text
  const getDurationTypeDisplay = () => {
    if (!booking) return '';
    
    // Check for durationType first (new field)
    if (booking.durationType) {
      return booking.durationType;
    }
    
    // Check for duration field (old field)
    if (booking.duration === 'halfDay') {
      return 'Half Day';
    } else if (booking.duration === 'fullDay') {
      return 'Full Day';
    }
    
    // Check activity pricing type
    if (booking.activity?.pricingType === 'half-full-day') {
      // If we have pricePerPerson, we can infer
      if (booking.pricePerPerson && booking.activity) {
        if (booking.pricePerPerson === booking.activity.halfDayPrice) {
          return 'Half Day';
        } else if (booking.pricePerPerson === booking.activity.fullDayPrice) {
          return 'Full Day';
        }
      }
    }
    
    return 'Standard';
  };

  // Get price per person display
  const getPricePerPersonDisplay = () => {
    if (booking?.pricePerPerson) {
      return `$${booking.pricePerPerson}`;
    }
    
    // Calculate from total price and guests
    if (booking?.totalPrice && booking?.guests) {
      return `$${(booking.totalPrice / booking.guests).toFixed(2)}`;
    }
    
    return 'N/A';
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await bookingsAPI.updateStatus(id, newStatus);
      if (response.data.success) {
        setBooking({
          ...booking,
          status: newStatus
        });
      } else {
        setError('Failed to update booking status');
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/bookings')}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
        >
          Back to Bookings
        </button>
      </AdminLayout>
    );
  }

  if (!booking) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600">Booking not found</h2>
          <button
            onClick={() => navigate('/admin/bookings')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  const durationType = getDurationTypeDisplay();
  const pricePerPerson = getPricePerPersonDisplay();

  return (
    <AdminLayout>
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Booking Details
          <span className="ml-2 text-gray-500 text-lg font-normal">#{booking.bookingReference}</span>
        </h1>
        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => navigate('/admin/bookings')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Bookings
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Summary */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Summary</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Created on {formatTimestamp(booking.createdAt)}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Activity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.activity ? booking.activity.title : 'Unknown Activity'}
                  {booking.activity?.pricingType === 'half-full-day' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Half/Full Day Pricing
                    </span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Booking Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(booking.date)}
                </dd>
              </div>
              
              {/* Duration Type (Half Day / Full Day) */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Duration Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      durationType === 'Half Day' 
                        ? 'bg-purple-100 text-purple-800' 
                        : durationType === 'Full Day'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {durationType === 'Half Day' && (
                        <svg className="mr-1.5 h-2 w-2 text-purple-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {durationType === 'Full Day' && (
                        <svg className="mr-1.5 h-2 w-2 text-indigo-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {durationType}
                    </span>
                  </div>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.guests} {booking.guests === 1 ? 'person' : 'people'}
                </dd>
              </div>
              
              {/* Price Per Person */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Price Per Person</dt>
                <dd className="mt-1 text-sm font-medium text-green-700 sm:mt-0 sm:col-span-2">
                  {pricePerPerson}
                  {durationType !== 'Standard' && (
                    <span className="ml-2 text-xs text-gray-500">({durationType})</span>
                  )}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                <dd className="mt-1 text-sm font-medium text-blue-700 sm:mt-0 sm:col-span-2">
                  ${booking.totalPrice}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal and contact details</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.fullName}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.phone}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Special requests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.specialRequests || 'None'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Additional Booking Details */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Additional Details</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* Activity Pricing Information */}
            {booking.activity && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Activity Pricing</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium">Base Price:</span> ${booking.activity.price}
                    </div>
                    {booking.activity.halfDayPrice && (
                      <div>
                        <span className="font-medium">Half Day:</span> ${booking.activity.halfDayPrice}
                      </div>
                    )}
                    {booking.activity.fullDayPrice && (
                      <div>
                        <span className="font-medium">Full Day:</span> ${booking.activity.fullDayPrice}
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}
            
            {/* Booking Calculation Details */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Price Calculation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Price per person:</span>
                    <span>{pricePerPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of guests:</span>
                    <span>{booking.guests}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-blue-700">${booking.totalPrice}</span>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Booking Actions</h3>

          <div className="flex flex-wrap gap-3">
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Confirm Booking'}
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Cancel Booking'}
                </button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Processing...' : 'Cancel Booking'}
              </button>
            )}

            {booking.status === 'cancelled' && (
              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={updating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Processing...' : 'Reactivate Booking'}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingDetail;