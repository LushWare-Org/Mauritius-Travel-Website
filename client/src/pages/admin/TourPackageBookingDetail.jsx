import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { tourPackageBookingsAPI } from '../../utils/api';

const TourPackageBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

   useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError('');
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view booking details');
          navigate('/login');
          return;
        }

        console.log('🔍 Fetching booking with ID:', id);
        console.log('🔑 Token present:', !!token);
        
        const response = await tourPackageBookingsAPI.getById(id);
        
        console.log('📦 API Response:', response);
        
        if (response.data && response.data.success) {
          setBooking(response.data.data);
        } else {
          setError(response.data?.message || 'Failed to fetch booking details');
        }
      } catch (err) {
        console.error('❌ Error fetching booking details:', err);
        
        // Enhanced error handling
        if (err.response) {
          // Server responded with error status
          switch (err.response.status) {
            case 401:
              setError('Unauthorized. Please log in again.');
              localStorage.removeItem('token');
              navigate('/login');
              break;
            case 403:
              setError('You do not have permission to view this booking.');
              break;
            case 404:
              setError('Booking not found.');
              break;
            case 500:
              setError('Server error. Please try again later.');
              break;
            default:
              setError(`Error: ${err.response.data?.message || 'Unknown error'}`);
          }
        } else if (err.request) {
          // Request was made but no response
          setError('No response from server. Please check your connection.');
        } else {
          // Something else happened
          setError('Error: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [id, navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `Rs ${price.toLocaleString()}`;
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await tourPackageBookingsAPI.updateStatus(id, newStatus);
      if (response.data.success) {
        setBooking({ ...booking, status: newStatus });
        setError('');
      } else {
        setError('Failed to update booking status');
      }
    } catch (err) {
      console.error(err);
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
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
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
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={() => navigate('/admin/tour-package-bookings')}
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
            onClick={() => navigate('/admin/tour-package-bookings')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Booking Details
          <span className="ml-2 text-gray-500 text-lg font-normal">#{booking.bookingReference || booking._id}</span>
        </h1>
        <button
          onClick={() => navigate('/admin/tour-package-bookings')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Bookings
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Summary */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Summary</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Created on {formatDate(booking.createdAt)}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tour Package</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.packageId?.title || booking.packageTitle || 'Unknown Package'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Booking Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(booking.date)}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.guests} {booking.guests === 1 ? 'person' : 'people'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                <dd className="mt-1 text-sm font-medium text-blue-700 sm:mt-0 sm:col-span-2">
                  {formatPrice((booking.packageId?.price || booking.totalPrice) * booking.guests)}
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
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.fullName || booking.userName}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.email || booking.userEmail}</dd>
              </div>
              {booking.phone || booking.userPhone ? (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.phone || booking.userPhone}</dd>
                </div>
              ) : null}
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Special Requests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.specialRequests || 'None'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

{/* Selected Activities Section */}
{booking.selectedActivities && booking.selectedActivities.length > 0 && (
  <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
    <div className="px-4 py-5 sm:px-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900">Selected Activities</h3>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        {booking.selectedActivities.length} activity(s) included
      </p>
    </div>
    <div className="border-t border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-4">
          {booking.selectedActivities.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
              <div>
                <h4 className="font-medium text-gray-800">{item.title}</h4>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity} × Rs {item.price}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">Rs {item.price * item.quantity}</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <span className="font-medium text-gray-700">Activities Subtotal:</span>
            <span className="font-bold text-blue-600">Rs{booking.activitiesTotal}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

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
                  className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Confirm Booking'}
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updating}
                  className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Cancel Booking'}
                </button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Processing...' : 'Cancel Booking'}
              </button>
            )}

            {booking.status === 'cancelled' && (
              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={updating}
                className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Processing...' : 'Reactivate Booking'}
              </button>
            )}
          </div>

          {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TourPackageBookingDetail;
