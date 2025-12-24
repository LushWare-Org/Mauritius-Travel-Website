// src/pages/TourPackageBookingRequest.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { tourPackagesAPI, tourPackageBookingsAPI, userBookingsAPI } from '../utils/api';
import ConfirmationModal from '../components/booking/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

const TourPackageBookingRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // User currency preference
  const userCurrency = useMemo(() => 
    searchParams.get('currency') || 
    localStorage.getItem('preferredCurrency') || 
    'MUR'
  , [searchParams]);

  const [formData, setFormData] = useState({
    date: '',
    guests: 1,
    fullName: '',
    email: '',
    phone: '',
    selectedActivities: [],
    specialRequests: '',
    includeTransfer: false,
    transferDetails: null
  });

  // Memoized currency helpers
  const currencyHelpers = useMemo(() => {
    const simpleCurrency = userCurrency.toUpperCase() === 'EUR' ? 'euro' : 'rs';
    const currencyCode = simpleCurrency === 'euro' ? 'EUR' : 'MUR';
    
    const formatCurrency = (amount) => {
      const num = parseFloat(amount) || 0;
      if (simpleCurrency === 'euro') {
        return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      } else {
        return new Intl.NumberFormat('en-MU', {
          style: 'currency',
          currency: 'MUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      }
    };

    const getCurrencyDisplayName = () => 
      simpleCurrency === 'euro' ? 'Euros (€)' : 'Mauritian Rupees (Rs)';

    const getTourPrice = (tourData) => {
      if (!tourData) return 0;
      if (simpleCurrency === 'euro') {
        return parseFloat(tourData.priceEUR || tourData.priceEuro || tourData.price || 0);
      } else {
        return parseFloat(tourData.priceMUR || tourData.priceRs || tourData.price || 0);
      }
    };

    const getActivityPrice = (activity) => {
      if (!activity) return 0;
      const duration = activity.duration || activity.durationType?.toLowerCase() || 'halfDay';
      const supportsDuration = activity.halfDayPrice || activity.fullDayPrice;
      
      if (supportsDuration) {
        if (simpleCurrency === 'euro') {
          if (duration.includes('half')) {
            return activity.halfDayPriceEUR || activity.halfDayPrice || 0;
          }
          return activity.fullDayPriceEUR || activity.fullDayPrice || 0;
        } else {
          if (duration.includes('half')) {
            return activity.halfDayPriceMUR || activity.halfDayPrice || 0;
          }
          return activity.fullDayPriceMUR || activity.fullDayPrice || 0;
        }
      } else {
        return simpleCurrency === 'euro' 
          ? activity.priceEUR || activity.price || 0
          : activity.priceMUR || activity.price || 0;
      }
    };

    const getCurrencyBadgeInfo = (currencyType) => {
      if (currencyType === 'both' || currencyType === 'dual') {
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Both MUR & EUR' };
      }
      return simpleCurrency === 'euro' 
        ? { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'EUR Only' }
        : { bg: 'bg-blue-100', text: 'text-blue-800', label: 'MUR Only' };
    };

    return {
      simpleCurrency,
      currencyCode,
      formatCurrency,
      getCurrencyDisplayName,
      getTourPrice,
      getActivityPrice,
      getCurrencyBadgeInfo
    };
  }, [userCurrency]);

  // Calculate totals
  const calculateActivityTotal = useMemo(() => 
    formData.selectedActivities.reduce((sum, activity) => {
      const price = currencyHelpers.getActivityPrice(activity);
      const quantity = activity.quantity || 1;
      return sum + (price * quantity);
    }, 0),
  [formData.selectedActivities, currencyHelpers]);

  const getActivityTotalPrice = (activity) => {
    const price = currencyHelpers.getActivityPrice(activity);
    const quantity = activity.quantity || 1;
    return price * quantity;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Not selected';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Prefill form data
  useEffect(() => {
    const updates = {};
    
    if (location.state?.selectedDate) {
      const dateStr = location.state.selectedDate;
      if (dateStr.includes('T')) {
        const dateObj = new Date(dateStr);
        updates.date = dateObj.toISOString().split('T')[0];
      } else {
        updates.date = dateStr;
      }
    }
    
    updates.guests = location.state?.guests || 1;
    
    if (location.state?.selectedActivities || location.state?.activitiesData) {
      const activities = location.state.activitiesData || location.state.selectedActivities;
      updates.selectedActivities = activities.map(activity => ({
        ...activity,
        _id: activity._id || activity.activityId,
        quantity: activity.quantity || 1,
        duration: activity.duration || activity.durationType?.toLowerCase() || 'halfDay'
      }));
    }
    
    if (location.state?.includeTransfer) {
      updates.includeTransfer = location.state.includeTransfer;
      updates.transferDetails = location.state.transferDetails;
    }
    
    if (currentUser) {
      if (currentUser.email && !formData.email) updates.email = currentUser.email;
      if (currentUser.name && !formData.fullName) updates.fullName = currentUser.name;
      if (currentUser.phone && !formData.phone) updates.phone = currentUser.phone;
    }
    
    if (Object.keys(updates).length) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [location.state, currentUser]);

  // Fetch tour details
  useEffect(() => {
    const fetchTour = async () => {
      setLoading(true);
      try {
        const params = { currency: currencyHelpers.currencyCode };
        const resp = await tourPackagesAPI.getById(id, params);
        const found = resp?.data?.data;
        if (found) {
          setTour({
            ...found,
            priceMUR: parseFloat(found.priceMUR || found.priceRs || found.price || 0),
            priceEUR: parseFloat(found.priceEUR || found.priceEuro || found.price || 0),
            currencyType: found.currencyType || 
              (found.priceMUR && found.priceEUR ? 'both' : 
               found.priceEUR ? 'euro-only' : 'rs-only')
          });
        }
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Failed to load tour details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTour();
  }, [id, currencyHelpers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.date || !formData.fullName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    const reference = `TPB-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingReference(reference);

    try {
      const selectedActivitiesWithPrices = formData.selectedActivities.map(activity => ({
        ...activity,
        activityId: activity._id || activity.activityId,
        selectedPrice: currencyHelpers.getActivityPrice(activity),
        quantity: activity.quantity || 1,
        duration: activity.duration || 'halfDay',
        selectedCurrency: currencyHelpers.currencyCode,
        total: currencyHelpers.getActivityPrice(activity) * (activity.quantity || 1)
      }));

      const transferTotal = formData.includeTransfer && formData.transferDetails 
        ? parseFloat(formData.transferDetails.transferPrice) || 0 
        : 0;

      const tourPrice = currencyHelpers.getTourPrice(tour);
      const tourTotal = tourPrice * formData.guests;
      const activitiesTotal = calculateActivityTotal;
      const grandTotal = tourTotal + activitiesTotal + transferTotal;

      const bookingData = {
        tourPackageId: id,
        startDate: formData.date,
        guests: formData.guests,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        specialRequests: formData.specialRequests,
        bookingReference: reference,
        selectedActivities: selectedActivitiesWithPrices,
        currency: currencyHelpers.currencyCode,
        includeTransfer: formData.includeTransfer,
        transferDetails: formData.transferDetails,
        tourPrice,
        activitiesTotal,
        transferTotal,
        totalAmount: grandTotal,
        bookingSource: 'web'
      };

      const response = await tourPackageBookingsAPI.create(bookingData);

      if (response?.data?.success) {
        setBookingId(response.data.data._id);
        setIsModalOpen(true);
        
        // Refresh bookings in background
        Promise.allSettled([
          userBookingsAPI.getStats(),
          userBookingsAPI.getUpcoming(),
          userBookingsAPI.getHistory()
        ]);
      } else {
        throw new Error(response?.data?.message || 'Unknown server error');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/bookings');
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading tour details...</p>
      </div>
    );
  }

  // Error states
  if (error && !tour) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-exclamation-circle text-red-500 text-xl mr-3"></i>
            <h2 className="text-lg sm:text-xl font-bold text-red-700">Error</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/tour-packages')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Back to Tour Packages
          </button>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-search text-yellow-600 text-xl mr-3"></i>
            <h2 className="text-lg sm:text-xl font-bold text-yellow-800">Tour Not Found</h2>
          </div>
          <p className="text-yellow-700 mb-4">Sorry, we couldn't find the tour you're looking for.</p>
          <button
            onClick={() => navigate('/tour-packages')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Browse Tour Packages
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const tourPrice = currencyHelpers.getTourPrice(tour);
  const tourTotal = tourPrice * formData.guests;
  const transferTotal = formData.includeTransfer && formData.transferDetails 
    ? parseFloat(formData.transferDetails.transferPrice) || 0 
    : 0;
  const grandTotal = tourTotal + calculateActivityTotal + transferTotal;
  const currencyBadge = currencyHelpers.getCurrencyBadgeInfo(tour.currencyType);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-1">Complete Your Booking</h1>
              <p className="text-gray-600 text-sm sm:text-base">Review details and complete your booking request</p>
            </div>
            <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
              <i className="fas fa-money-bill-wave text-blue-500 mr-2 text-sm"></i>
              <span className="text-sm font-medium text-blue-700">
                {currencyHelpers.getCurrencyDisplayName()}
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
              <div>
                <p className="text-blue-800 font-medium">Prices shown in {currencyHelpers.getCurrencyDisplayName()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="lg:w-2/3">
            {/* Tour Summary */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="sm:w-1/3">
                  <img 
                    src={tour.image || '/api/placeholder/400/300'} 
                    alt={tour.title} 
                    className="w-full h-40 sm:h-48 object-cover rounded-lg"
                  />
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currencyBadge.bg} ${currencyBadge.text}`}>
                      {currencyBadge.label}
                    </span>
                  </div>
                </div>
                <div className="sm:w-2/3">
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-2 line-clamp-2">{tour.title}</h2>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm sm:text-base">
                      <i className="fas fa-map-marker-alt text-gray-400 w-4 mr-2"></i>
                      <span>{tour.location || 'Multiple locations'}</span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base">
                      <i className="fas fa-clock text-gray-400 w-4 mr-2"></i>
                      <span>{tour.duration || '1'} day(s)</span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base">
                      <i className="fas fa-calendar text-gray-400 w-4 mr-2"></i>
                      <span className="font-medium">Date: {formatDateDisplay(formData.date)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500">Price per person</div>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-700">
                      {currencyHelpers.formatCurrency(tourPrice)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Activities */}
            {formData.selectedActivities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-4">
                  <i className="fas fa-hiking mr-2"></i>
                  Selected Activities
                </h3>
                <div className="space-y-3">
                  {formData.selectedActivities.map((activity, index) => {
                    const activityTotal = getActivityTotalPrice(activity);
                    const duration = activity.duration || activity.durationType;
                    
                    return (
                      <div key={activity._id || index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-800 text-sm sm:text-base">{activity.title}</h4>
                              {duration && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  duration.includes('half') 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {duration.includes('half') ? 'Half Day' : 'Full Day'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {activity.quantity || 1} guest{activity.quantity > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold text-blue-700">
                              {currencyHelpers.formatCurrency(activityTotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Activities Total:</span>
                      <span className="text-lg font-bold text-blue-700">
                        {currencyHelpers.formatCurrency(calculateActivityTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Details */}
            {formData.includeTransfer && formData.transferDetails && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-4">
                  <i className="fas fa-plane mr-2"></i>
                  Airport Transfer
                </h3>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{formData.transferDetails.transferName}</h4>
                      <div className="text-xs text-gray-600">
                        {formData.transferDetails.vehicleType} • {formData.transferDetails.transferType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-bold text-blue-700">
                        {currencyHelpers.formatCurrency(transferTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:w-1/3">
            <div className="sticky top-6">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-4">Booking Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests *</label>
                    <select
                      name="guests"
                      value={formData.guests}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      {Array.from({ length: tour.maxParticipants || 10 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      placeholder="+230 5XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-24"
                      placeholder="Any special requests..."
                    />
                  </div>
                </div>

                {/* Price Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">Price Summary</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tour × {formData.guests}</span>
                      <span>{currencyHelpers.formatCurrency(tourTotal)}</span>
                    </div>
                    
                    {calculateActivityTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Activities</span>
                        <span>{currencyHelpers.formatCurrency(calculateActivityTotal)}</span>
                      </div>
                    )}
                    
                    {transferTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Transfer</span>
                        <span>{currencyHelpers.formatCurrency(transferTotal)}</span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-base">Total</span>
                        <span className="text-lg sm:text-xl font-bold text-blue-700">
                          {currencyHelpers.formatCurrency(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm sm:text-base ${
                      submitting 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition-colors`}
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Send Booking Request
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate(`/tour-packages/${id}`)}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm sm:text-base transition-colors"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Tour
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-sm text-red-700">
                      <i className="fas fa-exclamation-circle mr-2"></i>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        bookingReference={bookingReference}
        activityTitle={tour.title}
        date={formData.date}
        guests={formData.guests}
        totalPrice={grandTotal}
        bookingId={bookingId}
        currency={currencyHelpers.simpleCurrency === 'euro' ? '€' : 'Rs'}
        tourImage={tour.image}
      />
    </div>
  );
};

export default TourPackageBookingRequest;