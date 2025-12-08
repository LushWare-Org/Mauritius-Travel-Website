import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import BookingStatusBadge from '../../components/dashboard/BookingStatusBadge';
import DashboardDebugger from '../../components/dashboard/DashboardDebugger';
import { userBookingsAPI, airportTransferBookingAPI } from '../../utils/api';

const MyBookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const [cancelNotification, setCancelNotification] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchBookings();
  }, [currentUser, retryCount]);
  
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await userBookingsAPI.getUpcoming();
      
      if (response.data.success) {
        let bookingsWithTransfers = response.data.data;
        
        if (currentUser?.email) {
          try {
            let airportTransfers = [];
            try {
              const userTransfersResponse = await airportTransferBookingAPI.getUserBookings();
              if (userTransfersResponse.data.success) {
                airportTransfers = userTransfersResponse.data.data;
              }
            } catch (userEndpointErr) {
              try {
                const allTransfersResponse = await airportTransferBookingAPI.getAllBookings();
                if (allTransfersResponse.data.success) {
                  airportTransfers = allTransfersResponse.data.filter(
                    transfer => transfer.email === currentUser.email
                  );
                }
              } catch (allTransfersErr) {
                console.log('Cannot fetch all airport transfers:', allTransfersErr.message);
              }
            }
            
            if (airportTransfers.length > 0) {
              bookingsWithTransfers = bookingsWithTransfers.map(booking => {
                const linkedTransfer = airportTransfers.find(
                  transfer => 
                    (transfer.specialRequests && transfer.specialRequests.includes(booking.bookingReference)) ||
                    transfer.activityBookingReference === booking.bookingReference ||
                    transfer.activityBookingId === booking._id
                );
                
                if (linkedTransfer) {
                  return {
                    ...booking,
                    airportTransfer: {
                      selected: true,
                      price: linkedTransfer.totalPrice || linkedTransfer.price || 0,
                      type: linkedTransfer.tripType === 'one-way' ? 'One Way' : 
                            linkedTransfer.tripType === 'round-trip' ? 'Round Trip' : 
                            linkedTransfer.tripType || 'Transfer',
                      details: linkedTransfer.transferType === 'airport-to-hotel' ? 'Airport to Hotel' :
                              linkedTransfer.transferType === 'hotel-to-airport' ? 'Hotel to Airport' :
                              linkedTransfer.transferType || 'Airport Transfer',
                      bookingReference: linkedTransfer.bookingReference,
                      status: linkedTransfer.status,
                      transferType: linkedTransfer.transferType,
                      tripType: linkedTransfer.tripType
                    }
                  };
                }
                return booking;
              });
            }
          } catch (transferErr) {
            console.log('Error fetching airport transfers:', transferErr.message);
          }
        }
        
        setBookings(bookingsWithTransfers);
        setError('');
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    setRetryCount(prevCount => prevCount + 1);
  };
  
  const filteredBookings = activeTab === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === activeTab);

  const bookingCounts = {
    all: bookings.length,
    pending: bookings.filter(booking => booking.status === 'pending').length,
    confirmed: bookings.filter(booking => booking.status === 'confirmed').length,
    cancelled: bookings.filter(booking => booking.status === 'cancelled').length
  };
  
  const handleCancelBooking = (booking) => {
    setCancelNotification({
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      activityName: booking.activity?.title || 'Unknown Activity',
      date: booking.date,
      totalPrice: booking.totalPrice
    });

    setTimeout(() => {
      if (cancelNotification?.bookingId === booking._id) {
        setCancelNotification(null);
      }
    }, 10000);
  };
  
  const handleContactAdminForCancellation = () => {
    if (cancelNotification) {
      navigate('/contact', {
        state: {
          prefillMessage: `I would like to cancel my activity booking (Reference: ${cancelNotification.bookingReference}) for "${cancelNotification.activityName}" scheduled on ${formatDate(cancelNotification.date)}. Please assist with the cancellation process and provide information about any applicable cancellation fees or refunds.`
        }
      });
      setCancelNotification(null);
    }
  };
  
  const handleCloseNotification = () => {
    setCancelNotification(null);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const calculateTotalPrice = (booking) => {
    let total = parseFloat(booking.totalPrice) || 0;
    
    if (booking.airportTransfer && booking.airportTransfer.price) {
      total += parseFloat(booking.airportTransfer.price);
    }
    
    return total;
  };

  return (
    <DashboardLayout title="My Bookings">
      <div>
        {/* Cancel Notification */}
        {cancelNotification && (
          <div className="fixed top-4 right-4 z-50 w-96">
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-blue-700">Booking Cancellation Request</p>
                </div>
                <button onClick={handleCloseNotification} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-blue-600 mb-4">
                To cancel booking <span className="font-medium">{cancelNotification.bookingReference}</span>, please contact our admin team.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleContactAdminForCancellation}
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  Contact Admin
                </button>
                <button
                  onClick={handleCloseNotification}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {Object.entries(bookingCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === status 
                    ? status === 'all' ? 'border-blue-600 text-blue-600' 
                      : status === 'pending' ? 'border-yellow-500 text-yellow-600'
                      : status === 'confirmed' ? 'border-green-600 text-green-600'
                      : 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </nav>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button 
                onClick={handleRefresh} 
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div key={booking._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Activity Image */}
                  <div className="md:w-1/4 h-48 md:h-auto">
                    <img 
                      src={booking.activity?.image} 
                      alt={booking.activity?.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Booking Details */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{booking.activity?.title || "Unknown Activity"}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {booking.activity?.location || "Location not available"}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                        <p className="font-medium mt-1">{formatDate(booking.date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Reference</p>
                        <p className="font-medium mt-1">{booking.bookingReference}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Price</p>
                        <p className="font-medium mt-1">
                          ${calculateTotalPrice(booking).toFixed(2)}
                          {booking.airportTransfer && booking.airportTransfer.price && (
                            <span className="text-xs text-green-600 ml-2">
                              (includes transfer)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Airport Transfer Info */}
                    {booking.airportTransfer && booking.airportTransfer.selected && (
                      <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium text-blue-700">Airport Transfer: </span>
                          <span className="text-blue-600 ml-1">${parseFloat(booking.airportTransfer.price).toFixed(2)}</span>
                          {booking.airportTransfer.type && (
                            <span className="ml-2 text-blue-500">({booking.airportTransfer.type})</span>
                          )}
                        </div>
                        {booking.airportTransfer.details && (
                          <p className="text-sm text-blue-600 mt-1 ml-6">{booking.airportTransfer.details}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                      <div className="text-sm text-gray-500">
                        Booked: {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        {booking.status === 'pending' && (
                          <button 
                            onClick={() => handleCancelBooking(booking)}
                            className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
                          >
                            Cancel Booking
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            onClick={() => handleCancelBooking(booking)}
                            className="px-4 py-2 border border-yellow-300 text-yellow-700 text-sm rounded hover:bg-yellow-50 transition-colors"
                          >
                            Request Cancellation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {activeTab === 'all' 
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings.`
              }
            </p>
            <a 
              href="/activities" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Browse Activities
            </a>
          </div>
        )}

        {/* Refresh Button */}
        {!loading && filteredBookings.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh List
            </button>
          </div>
        )}

        {/* Cancellation Info */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Need to cancel a booking?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Contact our support team for assistance with cancellations, refunds, and alternative options.
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
      <DashboardDebugger />
    </DashboardLayout>
  );
};

export default MyBookings;