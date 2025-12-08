import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tourPackageBookingsAPI } from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import BookingStatusBadge from '../../components/dashboard/BookingStatusBadge';

const TourPackageBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
  const fetchBookingDetails = async () => {
    setLoading(true);
    setError('');
    console.log('🔄 Starting fetchBookingDetails with ID:', id);
    console.log('👤 Current User:', currentUser);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        setError('Please log in to view booking details');
        navigate('/login');
        return;
      }

      console.log('📞 Calling API for booking:', id);
      
      const response = await tourPackageBookingsAPI.getById(id);
      console.log('✅ API Response received:', response.data);
      console.log('📊 Full booking data:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        const bookingData = response.data.data;
        console.log('📋 Booking data received:', {
          id: bookingData._id,
          status: bookingData.status,
          user: bookingData.user,
          totalPrice: bookingData.totalPrice,
          packagePrice: bookingData.packagePrice,
          activitiesTotal: bookingData.activitiesTotal,
          selectedActivities: bookingData.selectedActivities
        });
        
        // DEBUG: Check user structure
        console.log('🔍 User object analysis:', {
          userIsObject: typeof bookingData.user === 'object',
          userIsString: typeof bookingData.user === 'string',
          userHasId: bookingData.user?._id !== undefined,
          userValue: bookingData.user
        });
        
        // FIXED: Better user authorization check
        let bookingUserId;
        
        if (typeof bookingData.user === 'object' && bookingData.user !== null) {
          // User is populated object
          bookingUserId = bookingData.user._id?.toString();
        } else if (typeof bookingData.user === 'string') {
          // User is string ID
          bookingUserId = bookingData.user;
        } else {
          // Try to get user from other fields
          bookingUserId = bookingData.userId || bookingData.user;
        }
        
        const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
        
        console.log('🔐 User check DETAILED:', {
          bookingUserId,
          currentUserId,
          currentUser: currentUser,
          isAdmin: currentUser?.role === 'admin',
          bookingUserIdType: typeof bookingUserId,
          currentUserIdType: typeof currentUserId
        });
        
        // If we can't get a valid user ID, skip the check and show the booking
        if (!bookingUserId) {
          console.log('⚠️ Booking user ID not found, showing booking anyway');
          setBooking(bookingData);
          return;
        }
        
        if (!currentUserId) {
          console.log('⚠️ Current user ID not found');
          setError('Please log in to view booking details');
          navigate('/login');
          return;
        }
        
        if (bookingUserId.toString() !== currentUserId.toString() && currentUser?.role !== 'admin') {
          console.log('⛔ Unauthorized access');
          setError('You are not authorized to view this booking');
          setTimeout(() => navigate('/dashboard/tour-package-bookings'), 2000);
          return;
        }
        
        setBooking(bookingData);
        console.log('✅ Booking set in state');
      } else {
        console.log('❌ API returned success: false');
        setError(response.data.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      console.error('💥 Error in fetchBookingDetails:', {
        name: err.name,
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config?.url
      });
      
      // Better error messages
      if (err.response?.status === 404) {
        setError('Booking not found');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this booking.');
        setTimeout(() => navigate('/dashboard/tour-package-bookings'), 2000);
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later or contact support.');
      } else if (err.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      console.log('🏁 Fetch completed');
      setLoading(false);
    }
  };

  if (id && currentUser) {
    console.log('✅ Conditions met: id and currentUser exist');
    fetchBookingDetails();
  } else if (id && !currentUser) {
    console.log('⏳ Waiting for user authentication... id exists but currentUser is:', currentUser);
    setError('Please log in to view booking details');
    navigate('/login');
  } else {
    console.log('❌ Missing booking ID or user. id:', id, 'currentUser:', currentUser);
    setError('Invalid booking reference');
    navigate('/dashboard/tour-package-bookings');
  }
}, [id, currentUser, navigate]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    setCancelling(true);
    try {
      const response = await tourPackageBookingsAPI.cancel(id);

      if (response.data.success) {
        setBooking(response.data.data);
        alert('Booking cancelled successfully');
      } else {
        setError('Failed to cancel booking: ' + (response.data.message || ''));
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rs 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MUR', 
      currencyDisplay: 'narrowSymbol', 
  }).format(amount);

  };

  // Calculate package total
  const calculatePackageTotal = () => {
    if (booking?.packagePrice && booking?.guests) {
      return booking.packagePrice * booking.guests;
    }
    if (booking?.tourPackage?.price && booking?.guests) {
      return booking.tourPackage.price * booking.guests;
    }
    return 0;
  };

  // Calculate activities total
  const calculateActivitiesTotal = () => {
    if (booking?.activitiesTotal) {
      return booking.activitiesTotal;
    }
    if (booking?.selectedActivities && booking.selectedActivities.length > 0) {
      return booking.selectedActivities.reduce(
        (sum, activity) => sum + (Number(activity.price) || 0) * (activity.quantity || booking.guests || 1),
        0
      );
    }
    return 0;
  };

  // Calculate transfer total
  const calculateTransferTotal = () => {
    // Use the stored transferTotal if available
    if (booking?.transferTotal) {
      return booking.transferTotal;
    }
    // Otherwise check airportTransferBooking
    if (booking?.airportTransferBooking?.totalPrice) {
      return booking.airportTransferBooking.totalPrice;
    }
    return 0;
  };

  // Get the display total
  const getDisplayTotal = () => {
    if (booking?.totalPrice) {
      return booking.totalPrice;
    }
    return calculatePackageTotal() + calculateActivitiesTotal() + calculateTransferTotal();
  };

  if (loading) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => navigate('/dashboard/tour-package-bookings')}
            className="mt-3 bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Back to Bookings
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Booking not found</h3>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/tour-package-bookings')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Back to Bookings
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate values
  const packageTotal = calculatePackageTotal();
  const activitiesTotal = calculateActivitiesTotal();
  const transferTotal = calculateTransferTotal();
  const displayTotal = getDisplayTotal();
  const pricePerPerson = booking.tourPackage?.price || booking.packagePrice || 0;

  return (
    <DashboardLayout title="Booking Details">
      <div>
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Booking Details</h2>
              <p className="text-gray-600">Reference: <span className="font-medium">{booking.bookingReference}</span></p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="mt-2">
            <Link
              to="/dashboard/tour-package-bookings"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to all bookings
            </Link>
          </div>
        </div>

        {/* Booking Information */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tour Package Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-800">{booking.tourPackage?.title || "Unknown Package"}</h4>
                  <div className="flex items-center text-gray-600 mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {/*<span>{booking.tourPackage?.location || "Location not available"}</span>*/}
                  </div>
                </div>

                <div className="space-y-3">
                  {/*<div>
                    <p className="text-sm text-gray-500 mb-1">Package Duration</p>
                    <p className="font-medium">{booking.tourPackage?.duration || 'N/A'}</p>
                  </div>*/}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Package Description</p>
                    <p className="text-gray-700">{booking.tourPackage?.description || 'No description available'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Booking Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(booking.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Guests:</span>
                    <span className="font-medium">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Person:</span>
                    <span className="font-medium">{formatCurrency(pricePerPerson)}</span>
                  </div>
                  
                  {/* Package Price Breakdown */}
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Package Total:</span>
                      <span className="font-medium">{formatCurrency(packageTotal)}</span>
                    </div>
                  </div>
                  
                  {/* Total Price */}
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-gray-600 font-medium">Total Price:</span>
                    <span className="font-bold text-lg">{formatCurrency(displayTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Activities Section - Updated with better display */}
        {booking.selectedActivities && booking.selectedActivities.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Selected Activities</h3>
              <p className="text-gray-600 mb-4">
                {booking.selectedActivities.length} activity(s) included
              </p>
              
              <div className="space-y-4">
                {booking.selectedActivities.map((item, index) => {
                  const quantity = item.quantity || booking.guests || 1;
                  const price = Number(item.price) || 0;
                  const itemTotal = price * quantity;
                  
                  return (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.title}</h4>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(price)} per person × {quantity} {quantity === 1 ? 'person' : 'people'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">{formatCurrency(itemTotal)}</p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Activities Subtotal */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Activities Subtotal:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(activitiesTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Summary Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Price Summary</h3>
            <div className="space-y-3">
              {/* Package Breakdown */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Tour Package:</h4>
                <div className="pl-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span>{formatCurrency(pricePerPerson)} × {booking.guests} {booking.guests === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex justify-between font-medium mt-1">
                    <span>Package Total:</span>
                    <span>{formatCurrency(packageTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Activities Breakdown */}
              {activitiesTotal > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700">Activities:</h4>
                  <div className="pl-4">
                    {booking.selectedActivities?.map((item, index) => {
                      const quantity = item.quantity || booking.guests || 1;
                      const price = Number(item.price) || 0;
                      const itemTotal = price * quantity;
                      
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.title}:</span>
                          <span>{formatCurrency(price)} × {quantity} = {formatCurrency(itemTotal)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between font-medium mt-1">
                      <span>Activities Total:</span>
                      <span>{formatCurrency(activitiesTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transfer Breakdown */}
              {transferTotal > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <h4 className="font-medium text-gray-700">Airport Transfer:</h4>
                  <div className="pl-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {booking.airportTransferBooking?.transfer?.airportName || 'Airport Transfer'}:
                      </span>
                      <span>{formatCurrency(transferTotal)} ({booking.airportTransferBooking?.tripType?.replace('-', ' ') || 'One Way'})</span>
                    </div>
                    <div className="flex justify-between font-medium mt-1">
                      <span>Transfer Total:</span>
                      <span>{formatCurrency(transferTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Total */}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Grand Total:</span>
                <span className="text-blue-600">{formatCurrency(displayTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="font-medium">{booking.fullName || currentUser?.name || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Email Address</p>
                  <p className="font-medium">{booking.email || currentUser?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-medium">{booking.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                  <div className="bg-gray-50 p-4 rounded border border-gray-100 min-h-[80px]">
                    {booking.specialRequests ? (
                      <p className="text-gray-700">{booking.specialRequests}</p>
                    ) : (
                      <p className="text-gray-500 italic">No special requests</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">Booking Created</p>
                  <p className="text-gray-500 text-sm">{formatDate(booking.createdAt)}</p>
                </div>
              </div>
              {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-medium">Last Updated</p>
                    <p className="text-gray-500 text-sm">{formatDate(booking.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {(booking.status === 'pending' || booking.status === 'confirmed') && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Actions</h3>
              <div className="flex flex-wrap gap-4">
                {/*<button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>*/}
                <button
                  onClick={() => navigate('/dashboard/tour-package-bookings')}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Back to Bookings
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Print Booking
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Note: Bookings can only be cancelled at least 24 hours before the start date.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TourPackageBookingDetail;