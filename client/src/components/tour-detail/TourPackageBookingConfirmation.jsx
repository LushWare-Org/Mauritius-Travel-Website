// src/pages/TourPackageBookingConfirmation.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tourPackageBookingsAPI, tourPackagesAPI } from '../../utils/api';

const TourPackageBookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: tourId } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Get user currency preference
  const userCurrency = useMemo(() => 
    searchParams.get('currency') || 
    localStorage.getItem('preferredCurrency') || 
    'rs'
  , [searchParams]);

  // Extract state data
  const {
    selectedDate,
    guests = 1,
    selectedActivities = [],
    activitiesData = [],
    includeTransfer = false,
    transferDetails = null,
    packageTotal = 0,
    activitiesTotal = 0,
    transferTotal = 0,
  } = location.state || {};

  const [tour, setTour] = useState(null);
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    countryCode: '+230',
    phone: currentUser?.phone || '',
    specialRequests: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingTour, setFetchingTour] = useState(true);
  const [error, setError] = useState('');
  const [calculatedPrices, setCalculatedPrices] = useState(null);
  const [formattedDate, setFormattedDate] = useState('');

  // Format date
  useEffect(() => {
    if (selectedDate) {
      try {
        let dateObj;
        
        if (typeof selectedDate === 'string') {
          if (selectedDate.includes(',')) {
            setFormattedDate(selectedDate);
            return;
          } else if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = selectedDate.split('-');
            dateObj = new Date(year, month - 1, day);
          } else {
            dateObj = new Date(selectedDate);
          }
        } else if (selectedDate instanceof Date) {
          dateObj = selectedDate;
        } else {
          setFormattedDate(String(selectedDate));
          return;
        }

        if (isNaN(dateObj.getTime())) {
          setFormattedDate(String(selectedDate));
          return;
        }

        const displayString = dateObj.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
        
        setFormattedDate(displayString);
        
      } catch (error) {
        setFormattedDate(String(selectedDate));
      }
    }
  }, [selectedDate]);

  // Get date for submission
  const getDateForSubmission = () => {
    if (!selectedDate) return '';
    
    try {
      let dateObj;
      
      if (typeof selectedDate === 'string') {
        if (selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return selectedDate;
        } else if (selectedDate.includes('T')) {
          dateObj = new Date(selectedDate);
        } else if (selectedDate.includes(',')) {
          dateObj = new Date(selectedDate);
        } else {
          dateObj = new Date(selectedDate);
        }
      } else if (selectedDate instanceof Date) {
        dateObj = selectedDate;
      } else {
        return String(selectedDate);
      }
      
      if (isNaN(dateObj.getTime())) {
        return String(selectedDate);
      }
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return String(selectedDate);
    }
  };

  // Redirect if no state data
  useEffect(() => {
    if (!selectedDate) {
      navigate(-1);
    }
  }, [selectedDate, navigate]);

  // Fetch tour details
  useEffect(() => {
    const fetchTourDetails = async () => {
      if (!tourId) return;
      
      try {
        setFetchingTour(true);
        const params = {};
        if (userCurrency) params.currency = userCurrency;
        
        const response = await tourPackagesAPI.getById(tourId, params);
        const tourData = response?.data?.data;
        
        if (tourData) {
          setTour({
            ...tourData,
            priceRs: tourData.priceRs || tourData.price || 0,
            priceEuro: tourData.priceEuro || tourData.price || 0,
            currencyType: tourData.currencyType || 'rs-only',
          });
        }
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Failed to load tour details.');
      } finally {
        setFetchingTour(false);
      }
    };
    
    fetchTourDetails();
  }, [tourId, userCurrency]);

  // Helper functions
  const getPriceInCurrency = useMemo(() => (priceRs, priceEuro, currencyType) => {
    if (userCurrency === 'euro') {
      return priceEuro || priceRs || 0;
    } else {
      return priceRs || 0;
    }
  }, [userCurrency]);

  const formatPrice = useMemo(() => (price) => {
    const num = parseFloat(price) || 0;
    if (userCurrency === 'euro') {
      return `€ ${num.toFixed(2)}`;
    } else {
      return `Rs ${Math.round(num).toLocaleString()}`;
    }
  }, [userCurrency]);

  const getCurrencyDisplayName = useMemo(() => () => {
    return userCurrency === 'euro' ? 'EUR (€)' : 'MUR (Rs)';
  }, [userCurrency]);

  const getCurrencyBadgeInfo = useMemo(() => (currencyType) => {
    switch (currencyType) {
      case 'both':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          label: 'Both Rs & Euro',
        };
      case 'rs-only':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          label: 'Rs Only',
        };
      case 'euro-only':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: 'Euro Only',
        };
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          label: 'Rs Only',
        };
    };
  }, []);

  // Calculate prices
  useEffect(() => {
    if (!tour) return;

    // Use passed totals or calculate
    let finalPackageTotal = packageTotal || 0;
    let finalActivitiesTotal = activitiesTotal || 0;
    let finalTransferTotal = transferTotal || 0;

    // Calculate if needed
    if (!packageTotal || !activitiesTotal) {
      const tourPriceInCurrency = getPriceInCurrency(
        tour.priceRs,
        tour.priceEuro,
        tour.currencyType
      );
      finalPackageTotal = parseFloat(tourPriceInCurrency) || 0;

      if (activitiesData && activitiesData.length > 0) {
        finalActivitiesTotal = activitiesData.reduce((sum, activity) => {
          const activityPrice = parseFloat(activity.price) || 0;
          return sum + activityPrice;
        }, 0);
      } else if (selectedActivities && selectedActivities.length > 0) {
        finalActivitiesTotal = selectedActivities.reduce((sum, activity) => {
          const activityPrice = getPriceInCurrency(
            activity.priceRs || activity.price,
            activity.priceEuro,
            activity.currencyType
          );
          return sum + activityPrice;
        }, 0);
      }

      if (includeTransfer && transferDetails) {
        const transferPrice = getPriceInCurrency(
          transferDetails.transferPrice,
          transferDetails.transferPriceEuro,
          transferDetails.currencyType
        );
        finalTransferTotal = parseFloat(transferPrice) || 0;
      }
    }

    const grandTotal = finalPackageTotal + finalActivitiesTotal + finalTransferTotal;
    
    setCalculatedPrices({
      packageTotal: finalPackageTotal,
      activitiesTotal: finalActivitiesTotal,
      transferTotal: finalTransferTotal,
      grandTotal,
      formattedGrandTotal: formatPrice(grandTotal),
      guests: parseInt(guests) || 1,
    });
  }, [tour, selectedActivities, activitiesData, includeTransfer, transferDetails, userCurrency, packageTotal, activitiesTotal, transferTotal, getPriceInCurrency, formatPrice, guests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submissionDate = getDateForSubmission();
      
      const bookingData = {
        tourPackage: tourId,
        user: currentUser._id,
        guests: parseInt(guests) || 1,
        startDate: submissionDate,
        fullName: formData.fullName || currentUser.name,
        email: formData.email || currentUser.email,
        phone: `${formData.countryCode}${formData.phone}`,
        specialRequests: formData.specialRequests || '',
        status: 'pending',
        bookingDate: new Date().toISOString().split('T')[0],
        currency: userCurrency === 'euro' ? 'EUR' : 'MUR',
        currencyType: tour?.currencyType || 'rs-only',
        totalPrice: calculatedPrices?.grandTotal || 0,
        packagePrice: calculatedPrices?.packageTotal || 0,
        activitiesTotal: calculatedPrices?.activitiesTotal || 0,
        transferTotal: calculatedPrices?.transferTotal || 0,
      };

      // Activities data
      if (activitiesData && activitiesData.length > 0) {
        bookingData.selectedActivities = activitiesData.map((activity) => ({
          activity: activity.activity || activity._id,
          title: activity.title,
          price: activity.price || 0,
          quantity: activity.quantity || 1,
          duration: activity.duration || null,
          durationType: activity.durationType || null,
          currency: bookingData.currency,
        }));
      } else if (selectedActivities && selectedActivities.length > 0) {
        bookingData.selectedActivities = selectedActivities.map((activity) => ({
          activity: activity._id || activity.activity,
          title: activity.title,
          price: getPriceInCurrency(activity.priceRs || activity.price, activity.priceEuro, activity.currencyType) || 0,
          quantity: guests,
          currency: bookingData.currency,
        }));
      }

      // Transfer data
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
          transferPrice: calculatedPrices?.transferTotal || 0,
          currency: bookingData.currency,
        };
      }

      const response = await tourPackageBookingsAPI.createWithActivities(bookingData);

      if (response.data.success) {
        navigate('/dashboard/tour-package-bookings', {
          state: {
            bookingReference: response.data.data.bookingReference,
            success: true,
            currency: userCurrency,
            totalAmount: calculatedPrices?.grandTotal,
          },
        });
      } else {
        setError(response.data.message || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
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

  // Loading state
  if (fetchingTour || !calculatedPrices) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  if (!selectedDate || !tour) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <i className="fas fa-exclamation-circle text-red-500 text-xl mr-3"></i>
            <h2 className="text-lg sm:text-xl font-bold text-red-700">Booking Information Missing</h2>
          </div>
          <p className="text-red-600 mb-4">Please go back and select your booking options.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currencyBadge = getCurrencyBadgeInfo(tour.currencyType);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-6">
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-1">Complete Your Booking</h1>
              <p className="text-gray-600 text-sm sm:text-base">Review details and confirm booking</p>
            </div>
            <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
              <i className="fas fa-money-bill-wave text-blue-500 mr-2 text-sm"></i>
              <span className="text-sm font-medium text-blue-700">
                {getCurrencyDisplayName()}
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
              <div>
                <p className="text-blue-800 font-medium">Prices shown in {userCurrency === 'euro' ? 'Euros (€)' : 'Mauritian Rupees (Rs)'}</p>
                <p className="text-blue-600 mt-1">
                  <i className="fas fa-users mr-1"></i>
                  For {guests} guest(s) • 
                  <i className="far fa-calendar ml-2 mr-1"></i>
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:w-2/3">
            {/* Tour Package Details */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-map-marked-alt mr-2 text-blue-500"></i>
                Tour Package
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-1/4">
                  <img 
                    src={tour.image || '/api/placeholder/400/300'} 
                    alt={tour.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currencyBadge.bg} ${currencyBadge.text}`}>
                      {currencyBadge.label}
                    </span>
                  </div>
                </div>
                <div className="sm:w-3/4">
                  <h3 className="text-xl font-bold text-blue-700 mb-2">{tour.title}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center">
                      <i className="fas fa-map-marker-alt text-gray-400 w-4 mr-2"></i>
                      <span>{tour.location || 'Multiple locations'}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-clock text-gray-400 w-4 mr-2"></i>
                      <span>{tour.duration || '1'} day(s)</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-users text-gray-400 w-4 mr-2"></i>
                      <span>{guests} guest(s)</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-calendar text-gray-400 w-4 mr-2"></i>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-500">Package Price</div>
                        <div className="text-lg sm:text-xl font-bold text-blue-700">
                          {formatPrice(calculatedPrices.packageTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Activities */}
            {selectedActivities && selectedActivities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-hiking mr-2 text-green-500"></i>
                  Selected Activities
                </h2>
                
                <div className="space-y-3">
                  {(activitiesData.length > 0 ? activitiesData : selectedActivities).map((activity, index) => {
                    let activityPrice = 0;
                    let activityTitle = '';
                    
                    if (activitiesData.length > 0) {
                      activityPrice = activity.price || 0;
                      activityTitle = activity.title;
                    } else {
                      activityPrice = getPriceInCurrency(
                        activity.priceRs || activity.price,
                        activity.priceEuro,
                        activity.currencyType
                      );
                      activityTitle = activity.title;
                    }
                    
                    return (
                      <div key={activity._id || activity.activity || index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base">{activityTitle}</h4>
                            {activity.description && (
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">{activity.description}</p>
                            )}
                            <div className="mt-2 flex items-center">
                              <span className={`text-xs px-2 py-1 rounded ${currencyBadge.bg} ${currencyBadge.text}`}>
                                {currencyBadge.label}
                              </span>
                              {activity.durationType && (
                                <span className="ml-2 text-xs text-blue-600">
                                  <i className="fas fa-clock mr-1"></i>
                                  {activity.durationType}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold text-green-600">
                              {formatPrice(activityPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Activities Total:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(calculatedPrices.activitiesTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Airport Transfer */}
            {includeTransfer && transferDetails && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-shuttle-van mr-2 text-purple-500"></i>
                  Airport Transfer
                </h2>
                
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">{transferDetails.transferName}</h4>
                      <div className="space-y-1 mt-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-600">
                          <i className="fas fa-car mr-2 text-gray-400"></i>
                          {transferDetails.vehicleType} • {transferDetails.transferCode}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <i className="fas fa-route mr-2 text-gray-400"></i>
                          {transferDetails.tripType === 'one-way' ? 'One Way' : 'Round Trip'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold text-purple-600">
                        {formatPrice(calculatedPrices.transferTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Booking Summary - Placed immediately before the form */}
            <div className="lg:hidden bg-white rounded-xl shadow-sm p-4 mb-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Booking Summary</h3>

              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-medium">{guests} person(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activities:</span>
                  <span className="font-medium">
                    {selectedActivities?.length || 0} selected
                  </span>
                </div>
                {includeTransfer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airport Transfer:</span>
                    <span className="font-medium text-green-600">Included</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Currency:</span>
                  <span className={`font-medium px-2 py-1 rounded text-xs ${currencyBadge.bg} ${currencyBadge.text}`}>
                    {getCurrencyDisplayName()}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Price Breakdown</h4>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour Package:</span>
                    <span className="font-medium">
                      {formatPrice(calculatedPrices.packageTotal)}
                    </span>
                  </div>
                  
                  {calculatedPrices.activitiesTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activities:</span>
                      <span className="font-medium">
                        {formatPrice(calculatedPrices.activitiesTotal)}
                      </span>
                    </div>
                  )}
                  
                  {calculatedPrices.transferTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airport Transfer:</span>
                      <span className="font-medium">
                        {formatPrice(calculatedPrices.transferTotal)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Total Amount */}
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800 text-base">Total Amount:</span>
                      <div className="text-xs text-gray-500 mt-1">
                        For {guests} guest(s) in {getCurrencyDisplayName()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {calculatedPrices.formattedGrandTotal}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form - Comes after booking summary on mobile */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-user-circle mr-2 text-blue-500"></i>
                Your Details
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={(e) =>
                        setFormData({ ...formData, countryCode: e.target.value })
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Any special requirements or requests..."
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-sm sm:text-base ${
                    loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white transition-colors flex items-center justify-center`}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Confirm Booking
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Desktop Total Summary */}
          <div className="hidden lg:block lg:w-1/3">
            <div className="sticky top-6 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                Booking Summary
              </h3>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-medium">{guests} person(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activities:</span>
                  <span className="font-medium">
                    {selectedActivities?.length || 0} selected
                  </span>
                </div>
                {includeTransfer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airport Transfer:</span>
                    <span className="font-medium text-green-600">Included</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Currency:</span>
                  <span className={`font-medium px-2 py-1 rounded text-xs ${currencyBadge.bg} ${currencyBadge.text}`}>
                    {getCurrencyDisplayName()}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3">Price Breakdown</h4>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour Package:</span>
                    <span className="font-medium">
                      {formatPrice(calculatedPrices.packageTotal)}
                    </span>
                  </div>
                  
                  {calculatedPrices.activitiesTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activities:</span>
                      <span className="font-medium">
                        {formatPrice(calculatedPrices.activitiesTotal)}
                      </span>
                    </div>
                  )}
                  
                  {calculatedPrices.transferTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airport Transfer:</span>
                      <span className="font-medium">
                        {formatPrice(calculatedPrices.transferTotal)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Total Amount */}
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total Amount:</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {calculatedPrices.formattedGrandTotal}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        For {guests} guest(s)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm sm:text-base flex items-center justify-center"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourPackageBookingConfirmation;