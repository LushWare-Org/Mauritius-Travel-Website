import React, { useState, useEffect } from 'react';
import { airportTransferBookingAPI } from '../../utils/airportTransferApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserAirportTransfers = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [contactAdminInfo, setContactAdminInfo] = useState(null);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await airportTransferBookingAPI.getUserBookings();
      
      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        setError('Failed to load your airport transfers');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load your airport transfers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCancelBooking = async (bookingId, bookingReference) => {
    // Show contact admin information instead of actual cancellation
    setContactAdminInfo({
      bookingReference,
      message: 'To cancel this booking, please contact our admin team.'
    });
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      setContactAdminInfo(null);
    }, 8000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">My Airport Transfers</h2>
        <p className="text-gray-600">View and manage your airport transfer bookings</p>
      </div>

      {/* Contact Admin Info Message */}
      {contactAdminInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-info-circle text-blue-400"></i>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700 font-medium mb-1">
                Contact Admin for Cancellation
              </p>
              <p className="text-sm text-blue-600">
                <strong>Booking:</strong> {contactAdminInfo.bookingReference}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {contactAdminInfo.message}
              </p>
              <div className="mt-2">
                <a 
                  href="mailto:admin@example.com?subject=Cancellation Request for Booking"
                  className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md inline-flex items-center mr-2"
                >
                  <i className="fas fa-envelope mr-1"></i>
                  Email Admin
                </a>
                <a 
                  href="tel:+1234567890"
                  className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md inline-flex items-center"
                >
                  <i className="fas fa-phone mr-1"></i>
                  Call Admin
                </a>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button 
                onClick={() => setContactAdminInfo(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <i className="fas fa-plane-slash text-gray-300 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No airport transfer bookings</h3>
          <p className="text-gray-500 mb-4">You haven't booked any airport transfers yet.</p>
          <a
            href="/airport-transfers"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <i className="fas fa-plane mr-2"></i>
            Book Airport Transfer
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {booking.transfer?.airportName} Transfer
                  </h3>
                  <p className="text-sm text-gray-500">
                    Booking Reference: {booking.bookingReference}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(booking.status)}
                  <span className="text-lg font-bold text-gray-900">
                    ${booking.totalPrice}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Trip Type</p>
                  <p className="font-medium capitalize">{booking.tripType.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transfer Type</p>
                  <p className="font-medium">
                    {booking.transferType === 'airport-to-hotel' && 'Airport → Hotel'}
                    {booking.transferType === 'hotel-to-airport' && 'Hotel → Airport'}
                    {booking.transferType === 'both' && 'Both Directions'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium capitalize">{booking.transfer?.vehicleType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Arrival</p>
                  <p className="font-medium">
                    {formatDate(booking.arrivalDate)} at {booking.arrivalTime}
                  </p>
                  {booking.flightNumber && (
                    <p className="text-sm text-gray-500">Flight: {booking.flightNumber}</p>
                  )}
                </div>
                {booking.departureDate && (
                  <div>
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="font-medium">
                      {formatDate(booking.departureDate)} at {booking.departureTime}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Passengers</p>
                  <p className="font-medium">{booking.passengers} person(s)</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View Details
                  </button>
                  
                  {/* Show Cancel button for cancellable statuses */}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelBooking(booking._id, booking.bookingReference)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
                    >
                      <i className="fas fa-times-circle mr-1"></i>
                      Cancel
                    </button>
                  )}
                  
                  {/* For completed/cancelled bookings, show disabled button */}
                  {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected') && (
                    <button
                      disabled
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded-md cursor-not-allowed flex items-center"
                    >
                      <i className="fas fa-ban mr-1"></i>
                      {booking.status === 'cancelled' ? 'Cancelled' : 'Cannot Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Booking Details
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Booking Reference</p>
                  <p className="font-medium">{selectedBooking.bookingReference}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Transfer Service</p>
                  <p className="font-medium">{selectedBooking.transfer?.airportName}</p>
                  <p className="text-sm text-gray-500">
                    {selectedBooking.transfer?.vehicleType} • Up to {selectedBooking.transfer?.capacity} passengers
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Contact Information</p>
                  <p className="font-medium">{selectedBooking.guestName}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.email}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.phone}</p>
                </div>
                
                {selectedBooking.specialRequests && (
                  <div>
                    <p className="text-sm text-gray-500">Special Requests</p>
                    <p className="text-sm">{selectedBooking.specialRequests}</p>
                  </div>
                )}
                
                {selectedBooking.adminNotes && (
                  <div>
                    <p className="text-sm text-gray-500">Admin Notes</p>
                    <p className="text-sm text-yellow-700">{selectedBooking.adminNotes}</p>
                  </div>
                )}
                
                {/* Cancel button in modal */}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-sm text-blue-700 mb-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      To cancel this booking, please contact our admin team.
                    </p>
                    <button
                      onClick={() => {
                        handleCancelBooking(selectedBooking._id, selectedBooking.bookingReference);
                        setSelectedBooking(null);
                      }}
                      className="w-full px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center justify-center"
                    >
                      <i className="fas fa-times-circle mr-2"></i>
                      Contact Admin to Cancel
                    </button>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Policy Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="fas fa-info-circle text-blue-600 text-xl"></i>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Cancellation Policy</h3>
            <ul className="text-blue-600 text-sm space-y-2">
              <li className="flex items-start">
                <i className="fas fa-exclamation-circle text-blue-500 mt-0.5 mr-2"></i>
                <span><strong>All Bookings:</strong> Please contact admin for cancellation requests</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone text-green-500 mt-0.5 mr-2"></i>
                <span><strong>Contact:</strong> Call +1 (234) 567-890 or email admin@example.com</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-clock text-yellow-500 mt-0.5 mr-2"></i>
                <span><strong>Office Hours:</strong> Mon-Fri 9AM-6PM, Sat 10AM-4PM (Local Time)</span>
              </li>
            </ul>
            <p className="text-blue-700 text-sm mt-3">
              <strong>Important:</strong> Cancellation fees may apply depending on timing. Please contact our admin team for assistance with any cancellation requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAirportTransfers;