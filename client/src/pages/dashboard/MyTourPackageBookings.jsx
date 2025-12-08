import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import BookingStatusBadge from '../../components/dashboard/BookingStatusBadge';
import DashboardDebugger from '../../components/dashboard/DashboardDebugger';
import { tourPackageBookingsAPI, tourPackagesAPI } from '../../utils/api';

const MyTourPackageBookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [packageImages, setPackageImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 MyTourPackageBookings component mounted');
    console.log('👤 Current user:', currentUser?.email);
    fetchBookings();
  }, [currentUser, retryCount]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);

      if (!token) {
        console.warn('No authentication token found');
        setError('Please log in to view your bookings');
        return;
      }
      
      console.log('📡 Calling API: tourPackageBookingsAPI.getAll()');
      
      const response = await tourPackageBookingsAPI.getAll();

      console.log('✅ API Response received');

      if (response.data.success) {
        console.log(`📊 Found ${response.data.data?.length || 0} bookings`);
        
        // CRITICAL: Log full booking structure to understand data
        const firstBooking = response.data.data?.[0];
        if (firstBooking) {
          console.log('🕵️‍♂️ FIRST BOOKING FULL STRUCTURE:');
          console.log('Booking ID:', firstBooking._id);
          console.log('Full booking:', firstBooking);
          console.log('tourPackage:', firstBooking.tourPackage);
          console.log('Has tourPackage?', !!firstBooking.tourPackage);
          console.log('Type of tourPackage:', typeof firstBooking.tourPackage);
          
          if (firstBooking.tourPackage) {
            console.log('tourPackage keys:', Object.keys(firstBooking.tourPackage));
            console.log('tourPackage.image exists?', 'image' in firstBooking.tourPackage);
            console.log('tourPackage.image value:', firstBooking.tourPackage.image);
            console.log('tourPackage.images exists?', 'images' in firstBooking.tourPackage);
            console.log('tourPackage.images value:', firstBooking.tourPackage.images);
          }
          
          console.log('packageId:', firstBooking.packageId);
          console.log('Has packageId?', !!firstBooking.packageId);
          console.log('Type of packageId:', typeof firstBooking.packageId);
          
          if (firstBooking.packageId && typeof firstBooking.packageId === 'object') {
            console.log('packageId keys:', Object.keys(firstBooking.packageId));
            console.log('packageId.image exists?', 'image' in firstBooking.packageId);
            console.log('packageId.image value:', firstBooking.packageId?.image);
          }
        }
        
        const bookingsData = response.data.data || [];
        setBookings(bookingsData);
        
        // Try to extract images from the data we have
        extractImagesFromBookings(bookingsData);
      } else {
        setError('Failed to fetch tour package bookings: ' + (response.data.message || ''));
      }
    } catch (err) {
      console.error('❌ Error fetching tour package bookings:', err);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractImagesFromBookings = (bookingsData) => {
    const imageMap = {};
    
    bookingsData.forEach(booking => {
      let foundImage = null;
      
      // Option 1: Check if tourPackage has image directly
      if (booking.tourPackage?.image) {
        foundImage = booking.tourPackage.image;
        console.log(`✅ Found image in tourPackage.image for booking ${booking._id}:`, 
          foundImage?.substring?.(0, 50) || foundImage);
      }
      // Option 2: Check if tourPackage has images array
      else if (booking.tourPackage?.images?.[0]) {
        foundImage = booking.tourPackage.images[0];
        console.log(`✅ Found image in tourPackage.images[0] for booking ${booking._id}`);
      }
      // Option 3: Check if packageId object has image
      else if (booking.packageId?.image && typeof booking.packageId === 'object') {
        foundImage = booking.packageId.image;
        console.log(`✅ Found image in packageId.image for booking ${booking._id}`);
      }
      // Option 4: packageId might be a string ID - we'll need to fetch it
      else if (booking.packageId && typeof booking.packageId === 'string') {
        console.log(`📥 Need to fetch package ${booking.packageId} for image`);
        // We'll fetch this separately if needed
      }
      
      if (foundImage) {
        imageMap[booking._id] = foundImage;
      } else {
        console.log(`❌ No image found in booking data for ${booking._id}`);
      }
    });
    
    setPackageImages(imageMap);
  };

  const handleRefresh = () => {
    setError('');
    setRetryCount(prev => prev + 1);
  };

  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const bookingCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    //completed: bookings.filter(b => b.status === 'completed').length
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Handle view details navigation
  const handleViewDetails = (bookingId) => {
    navigate(`/dashboard/tour-package-bookings/${bookingId}`);
  };

  // Get image URL with debugging
  const getImageUrl = (booking) => {
    // Check all possible image sources
    const imageSources = [
      { source: 'tourPackage.image', value: booking.tourPackage?.image },
      { source: 'tourPackage.images[0]', value: booking.tourPackage?.images?.[0] },
      { source: 'packageImages state', value: packageImages[booking._id] },
      { source: 'packageId.image', value: booking.packageId?.image },
    ];
    
    for (const { source, value } of imageSources) {
      if (value) {
        console.log(`🖼️ Booking ${booking._id}: Using image from ${source}:`, 
          value?.substring?.(0, 100) || value);
        return value;
      }
    }
    
    console.log(`🖼️ Booking ${booking._id}: No image found from any source`);
    return null;
  };

  // Image component with detailed error handling
  const BookingImage = ({ booking }) => {
    const imageUrl = getImageUrl(booking);
    const [hasError, setHasError] = useState(false);
    
    if (!imageUrl || hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <svg 
            className="w-16 h-16 text-gray-300 mb-3" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
          </svg>
          <p className="text-gray-400 text-center text-sm font-medium">
            {booking.tourPackage?.title || 'Tour Package'}
          </p>
          <p className="text-gray-300 text-xs text-center mt-1">
            {imageUrl ? 'Image failed to load' : 'No image available'}
          </p>
        </div>
      );
    }
    
    return (
      <img
        src={imageUrl}
        alt={booking.tourPackage?.title || "Tour Package"}
        className="w-full h-full object-cover"
        onLoad={() => console.log(`✅ Image loaded for booking ${booking._id}: ${imageUrl.substring(0, 50)}...`)}
        onError={(e) => {
          console.error(`❌ Image failed to load for booking ${booking._id}`);
          console.error('Image URL:', imageUrl);
          console.error('Image type:', typeof imageUrl);
          console.error('Image length:', imageUrl?.length);
          
          // Try to fix common issues
          const src = e.target.src;
          
          // If it's a relative path without leading slash
          if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
            console.log('🔄 Trying to fix relative path by adding /');
            e.target.src = `/${src}`;
          } else if (src && src.startsWith('http')) {
            console.log('🔄 Trying to add cache busting parameter');
            e.target.src = `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`;
          } else {
            setHasError(true);
          }
        }}
        loading="lazy"
      />
    );
  };

  return (
    <DashboardLayout title="My Tour Package Bookings">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">My Tour Package Bookings</h2>
          <p className="text-gray-600">View and manage all your tour package bookings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            {['all', 'pending', 'confirmed', 'cancelled'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? tab === 'pending' ? 'border-yellow-500 text-yellow-600'
                      : tab === 'confirmed' ? 'border-green-500 text-green-600'
                      : tab === 'cancelled' ? 'border-red-500 text-red-600'
                      //: tab === 'completed' ? 'border-blue-500 text-blue-600'
                      : 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({bookingCounts[tab] || 0})
              </button>
            ))}
          </nav>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={handleRefresh} className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 transition">
              Refresh Data
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
            <p className="text-gray-600">Loading your tour package bookings...</p>
          </div>
        ) : (
          /* Booking List */
          filteredBookings.length > 0 ? (
            <div className="space-y-6">
              {filteredBookings.map(booking => (
                <div key={booking._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="md:w-1/4 h-48 md:h-64 relative">
                      <BookingImage booking={booking} />
                      
                      <div className="absolute top-3 right-3">
                        <BookingStatusBadge status={booking.status} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{booking.tourPackage?.title || booking.packageId?.title || "Unknown Package"}</h3>
                        <div className="flex items-center text-gray-600 mb-1">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {/*<span className="text-sm">{booking.tourPackage?.location || booking.packageId?.location || "Location not available"}</span>*/}
                        </div>
                        {(booking.tourPackage?.duration || booking.packageId?.duration) && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">{booking.tourPackage?.duration || booking.packageId?.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Start Date</p>
                          <p className="font-medium text-gray-800">{formatDate(booking.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
                          <p className="font-medium text-gray-800">{booking.bookingReference}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Guests</p>
                          <p className="font-medium text-gray-800">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Price</p>
                          <p className="font-medium text-gray-800">Rs {booking.totalPrice?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      {/* Special Requests */}
                      {booking.specialRequests && (
                        <div className="mb-6">
                          <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">{booking.specialRequests}</p>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-sm text-gray-500 mb-3 sm:mb-0">
                          Booked on: <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewDetails(booking._id)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No tour package bookings found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {activeTab === 'all'
                  ? "You haven't booked any tour packages yet. Start exploring amazing vacation packages!"
                  : `You don't have any ${activeTab} bookings at the moment.`}
              </p>
              <div className="space-x-4">
                <Link
                  to="/tour-packages"
                  className="inline-flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Browse Tour Packages
                </Link>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Bookings
                </button>
              </div>
            </div>
          )
        )}

        {/* Refresh Button */}
        {!loading && filteredBookings.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-5 py-2.5 border border-purple-300 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Bookings
            </button>
          </div>
        )}
      </div>

      <DashboardDebugger />
    </DashboardLayout>
  );
};

export default MyTourPackageBookings;