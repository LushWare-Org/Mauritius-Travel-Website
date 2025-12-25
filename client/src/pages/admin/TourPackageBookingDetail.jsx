import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { tourPackageBookingsAPI } from '../../utils/api';
import { getCurrencySymbol, formatPrice } from '../../utils/currency'; // Import currency utilities

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
        console.log('🔍 Fetching booking details for ID:', id);
        const response = await tourPackageBookingsAPI.getById(id);
        
        if (response.data.success) {
          console.log('✅ Booking fetched successfully:', response.data.data);
          console.log('💰 Currency data:', {
            currency: response.data.data?.currency,
            totalPrice: response.data.data?.totalPrice,
            totalPriceEur: response.data.data?.totalPriceEur,
            totalPriceMur: response.data.data?.totalPriceMur,
            packagePrice: response.data.data?.packagePrice,
            packagePriceEur: response.data.data?.packagePriceEur
          });
          setBooking(response.data.data);
        } else {
          setError('Failed to fetch booking details: ' + (response.data.message || ''));
        }
      } catch (err) {
        console.error('❌ Error fetching booking:', err);
        setError('Error connecting to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get display price based on booking currency
  const getDisplayPrice = (priceType) => {
    if (!booking) return 0;
    
    const bookingCurrency = booking.currency || 'MUR';
    
    switch (priceType) {
      case 'total':
        if (bookingCurrency === 'EUR') {
          return booking.totalPriceEur || booking.totalPrice || 0;
        } else {
          return booking.totalPriceMur || booking.totalPrice || 0;
        }
      case 'package':
        if (bookingCurrency === 'EUR') {
          return booking.packagePriceEur || booking.packagePrice || 0;
        } else {
          return booking.packagePrice || booking.packagePrice || 0;
        }
      case 'activities':
        if (bookingCurrency === 'EUR') {
          return booking.activitiesTotalEur || booking.activitiesTotal || 0;
        } else {
          return booking.activitiesTotal || 0;
        }
      case 'transfer':
        if (bookingCurrency === 'EUR') {
          return booking.transferTotalEur || booking.transferTotal || 0;
        } else {
          return booking.transferTotal || 0;
        }
      default:
        return 0;
    }
  };

  // Format price with proper currency symbol
  const formatBookingPrice = (price, currency = null) => {
    const bookingCurrency = currency || booking?.currency || 'MUR';
    return formatPrice(price, bookingCurrency);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError('');
    try {
      const response = await tourPackageBookingsAPI.updateStatus(id, newStatus);
      if (response.data.success) {
        setBooking({ ...booking, status: newStatus });
      } else {
        setError('Failed to update booking status: ' + (response.data.message || ''));
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
      confirmed: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        <span className={`h-2 w-2 rounded-full mr-2 ${styles[status]?.split(' ')[0]?.replace('bg-', 'bg-')}`}></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Currency badge component
  const CurrencyBadge = () => {
    if (!booking) return null;
    
    const bookingCurrency = booking.currency || 'MUR';
    const styles = {
      MUR: 'bg-green-100 text-green-800 border border-green-200',
      EUR: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${styles[bookingCurrency] || styles.MUR}`}>
        <i className="fas fa-money-bill-wave mr-2"></i>
        {bookingCurrency === 'MUR' ? 'Mauritian Rupees (Rs)' : 'Euro (€)'}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Loading booking details...</p>
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
          onClick={() => navigate('/admin/tour-packages/bookings')}
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
            onClick={() => navigate('/admin/tour-packages/bookings')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  const bookingCurrency = booking.currency || 'MUR';
  const totalPrice = getDisplayPrice('total');
  const packagePrice = getDisplayPrice('package');
  const activitiesTotal = getDisplayPrice('activities');
  const transferTotal = getDisplayPrice('transfer');
  const totalPackagePrice = packagePrice * (booking.guests || 1);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Booking Details
              <span className="ml-2 text-gray-500 text-lg font-normal">#{booking.bookingReference}</span>
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <CurrencyBadge />
              <StatusBadge status={booking.status} />
              <span className="text-sm text-gray-500">
                Created on {formatDate(booking.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/tour-packages/bookings')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Bookings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Summary</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Complete booking information</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Tour Package</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.tourPackage?.title || 'Unknown Package'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(booking.startDate || booking.date)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.guests} {booking.guests === 1 ? 'person' : 'people'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Package Price</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatBookingPrice(packagePrice)} × {booking.guests} = {formatBookingPrice(totalPackagePrice)}
                  </dd>
                </div>
                
                {/* Activities */}
                {activitiesTotal > 0 && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Activities Total</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatBookingPrice(activitiesTotal)}
                    </dd>
                  </div>
                )}
                
                {/* Transfer */}
                {transferTotal > 0 && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Transfer Total</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatBookingPrice(transferTotal)}
                    </dd>
                  </div>
                )}
                
                {/* Total Price */}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Total Price</dt>
                  <dd className="mt-1 text-2xl font-bold text-blue-700 sm:mt-0 sm:col-span-2">
                    {formatBookingPrice(totalPrice)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Activities Details */}
          {booking.selectedActivities && booking.selectedActivities.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Selected Activities</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {booking.selectedActivities.length} activities selected
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {booking.selectedActivities.map((activity, index) => {
                        const activityPrice = bookingCurrency === 'EUR' ? 
                          (activity.priceEur || activity.price || 0) : 
                          (activity.price || 0);
                        const activityQuantity = activity.quantity || booking.guests || 1;
                        const activityTotal = activityPrice * activityQuantity;
                        
                        return (
                          <tr key={index}>
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {activity.title}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {activityQuantity}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatBookingPrice(activityPrice)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {formatBookingPrice(activityTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal and contact details</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.fullName}</dd>
                </div>
                <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.phone}</dd>
                </div>
                {booking.user && (
                  <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">User Account</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.user.name} ({booking.user.email})
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Special Requests */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Special Requests</h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-4">
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                  {booking.specialRequests || 'None provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Actions</h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6 space-y-3">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      disabled={updating}
                      className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>
                          Confirm Booking
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={updating}
                      className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-times-circle mr-2"></i>
                      Cancel Booking
                    </button>
                  </>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updating}
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-times-circle mr-2"></i>
                    Cancel Booking
                  </button>
                )}

                {booking.status === 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={updating}
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Reactivate Booking
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Currency Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Currency Information</h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Booking Currency</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {bookingCurrency === 'MUR' ? 'Mauritian Rupees (Rs)' : 'Euro (€)'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Original Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatBookingPrice(totalPrice)}
                  </dd>
                </div>
                {booking.currency === 'EUR' && booking.totalPriceMur && (
                  <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Equivalent in Rs</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      Rs {booking.totalPriceMur.toLocaleString()}
                    </dd>
                  </div>
                )}
                {booking.currency === 'MUR' && booking.totalPriceEur && (
                  <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Equivalent in €</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      €{booking.totalPriceEur.toFixed(2)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TourPackageBookingDetail;