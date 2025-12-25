// src/pages/TourPackageBookingRequest.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { tourPackagesAPI, tourPackageBookingsAPI, userBookingsAPI } from '../utils/api';
import ConfirmationModal from '../components/booking/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

// Extract currency logic into a separate hook for reusability
const useCurrency = (initialCurrency = null) => {
  const [searchParams] = useSearchParams();
  
  const userCurrency = useMemo(() => {
    // Priority: prop > URL param > localStorage > default
    const currency = initialCurrency || 
                    searchParams.get('currency') || 
                    localStorage.getItem('preferredCurrency') || 
                    'MUR'; // Default to 'MUR'
    
    // Normalize to 'MUR' or 'EUR' (uppercase)
    const normalized = currency.toString().toUpperCase();
    if (normalized === 'EUR' || normalized === 'EURO' || normalized === '€') {
      return 'EUR';
    } else if (normalized === 'RS' || normalized === 'MUR' || normalized === 'RUPEES' || normalized === '₹') {
      return 'MUR';
    } else {
      return 'MUR';
    }
  }, [initialCurrency, searchParams]);

  return userCurrency;
};

const TourPackageBookingRequest = ({ 
  currency: propCurrency = null, 
  onCurrencyChange = null 
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use the custom hook with prop priority
  const userCurrency = useCurrency(propCurrency);

  // Also get currency from location state if available (from booking form)
  const bookingCurrency = useMemo(() => {
    // Priority: location state > hook > localStorage
    if (location.state?.currency) {
      const curr = location.state.currency.toString().toUpperCase();
      return curr === 'EUR' ? 'EUR' : 'MUR';
    }
    return userCurrency;
  }, [location.state, userCurrency]);

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

  // Memoized currency helpers - FIXED: Use bookingCurrency from location state when available
  const currencyHelpers = useMemo(() => {
    const normalizedCurrency = bookingCurrency; // Use bookingCurrency which includes location state
    const isEuro = normalizedCurrency === 'EUR';
    
    // Get display price function similar to TourPackageListItem
    const getDisplayPrice = (tourData) => {
      if (!tourData) return { display: '', price: 0, currency: normalizedCurrency };
      
      const priceMUR = parseFloat(tourData.priceMUR || tourData.priceRs || tourData.price || 0);
      const priceEUR = parseFloat(tourData.priceEUR || tourData.priceEur || tourData.priceEuro || 0);
      const currencyType = tourData.currencyType || tourData.supportsCurrency || 'rs-only';
      
      // Determine available currencies
      const isMurAvailable = currencyType === 'both' || 
                            currencyType === 'rs-only' || 
                            currencyType === 'mur-only';
      const isEurAvailable = currencyType === 'both' || 
                            currencyType === 'eur-only' || 
                            currencyType === 'euro-only';
      
      let displayPrice, displayCurrency;
      
      if (isEuro && isEurAvailable && priceEUR > 0) {
        displayPrice = priceEUR;
        displayCurrency = 'EUR';
      } else if (isMurAvailable && priceMUR > 0) {
        displayPrice = priceMUR;
        displayCurrency = 'MUR';
      } else if (isEurAvailable && priceEUR > 0) {
        // Fallback to EUR if MUR not available
        displayPrice = priceEUR;
        displayCurrency = 'EUR';
      } else {
        displayPrice = 0;
        displayCurrency = 'MUR';
      }
      
      // Format display string
      let display = '';
      if (displayCurrency === 'EUR') {
        display = `€ ${displayPrice.toFixed(2)}`;
      } else {
        display = `Rs ${Math.round(displayPrice)}`;
      }
      
      return {
        display,
        price: displayPrice,
        currency: displayCurrency,
        hasAlternative: (isMurAvailable && isEurAvailable && priceMUR > 0 && priceEUR > 0),
        alternativeCurrency: isEuro ? 'MUR' : 'EUR',
        alternativePrice: isEuro ? priceMUR : priceEUR
      };
    };

    const formatCurrency = (amount, currencyCode = normalizedCurrency) => {
      const num = parseFloat(amount) || 0;
      if (currencyCode === 'EUR') {
        return `€ ${num.toFixed(2)}`;
      } else {
        return `Rs ${Math.round(num)}`;
      }
    };

    const getCurrencyDisplayName = () => 
      normalizedCurrency === 'EUR' ? 'Euros (€)' : 'Mauritian Rupees (Rs)';

    const getTourPrice = (tourData) => {
      if (!tourData) return 0;
      const priceInfo = getDisplayPrice(tourData);
      return priceInfo.price;
    };

    const getActivityPrice = (activity) => {
      if (!activity) return 0;
      const duration = activity.duration || activity.durationType?.toLowerCase() || 'halfDay';
      const supportsDuration = activity.halfDayPrice || activity.fullDayPrice;
      
      if (supportsDuration) {
        if (isEuro) {
          if (duration.includes('half')) {
            return parseFloat(activity.halfDayPriceEUR || activity.halfDayPriceEur || activity.halfDayPrice || 0);
          }
          return parseFloat(activity.fullDayPriceEUR || activity.fullDayPriceEur || activity.fullDayPrice || 0);
        } else {
          if (duration.includes('half')) {
            return parseFloat(activity.halfDayPriceMUR || activity.halfDayPriceRs || activity.halfDayPrice || 0);
          }
          return parseFloat(activity.fullDayPriceMUR || activity.fullDayPriceRs || activity.fullDayPrice || 0);
        }
      } else {
        return isEuro 
          ? parseFloat(activity.priceEUR || activity.priceEur || activity.price || 0)
          : parseFloat(activity.priceMUR || activity.priceRs || activity.price || 0);
      }
    };

    const getCurrencyBadgeInfo = (tourData) => {
      if (!tourData) return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'MUR Only' };
      
      const currencyType = tourData.currencyType || tourData.supportsCurrency;
      const priceMUR = parseFloat(tourData.priceMUR || tourData.priceRs || tourData.price || 0);
      const priceEUR = parseFloat(tourData.priceEUR || tourData.priceEur || tourData.priceEuro || 0);
      
      // Similar logic to TourPackageListItem
      if (currencyType === 'both' && priceMUR > 0 && priceEUR > 0) {
        return { 
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100', 
          text: 'text-green-800', 
          label: 'Dual Currency',
          icon: 'fas fa-exchange-alt'
        };
      } else if ((currencyType === 'eur-only' || currencyType === 'euro-only') && priceEUR > 0) {
        return { 
          bg: 'bg-gradient-to-r from-yellow-100 to-amber-100', 
          text: 'text-yellow-800', 
          label: '€ Only',
          icon: 'fas fa-euro-sign'
        };
      } else {
        return { 
          bg: 'bg-gradient-to-r from-blue-100 to-blue-200', 
          text: 'text-blue-800', 
          label: 'Rs Only',
          icon: 'fas fa-rupee-sign'
        };
      }
    };

    const getCurrencySymbol = () => isEuro ? '€' : 'Rs';

    return {
      currency: normalizedCurrency,
      isEuro,
      currencySymbol: getCurrencySymbol(),
      formatCurrency,
      getCurrencyDisplayName,
      getDisplayPrice,
      getTourPrice,
      getActivityPrice,
      getCurrencyBadgeInfo
    };
  }, [bookingCurrency]); // Changed dependency to bookingCurrency

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

  // Prefill form data - UPDATED: Also check for currency in location state
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
    
    // Check for currency in location state
    if (location.state?.currency) {
      console.log('Setting currency from location state:', location.state.currency);
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
        const resp = await tourPackagesAPI.getById(id);
        const found = resp?.data?.data;
        if (found) {
          // Map database fields to consistent names
          const tourData = {
            ...found,
            priceMUR: parseFloat(found.priceMUR || found.priceRs || found.price || 0),
            priceEUR: parseFloat(found.priceEUR || found.priceEur || found.priceEuro || 0),
            currencyType: found.currencyType || found.supportsCurrency || 
              (found.priceEUR > 0 && found.priceMUR > 0 ? 'both' :
               found.priceEUR > 0 ? 'eur-only' : 'rs-only')
          };
          console.log('Tour data loaded:', {
            id: tourData._id,
            title: tourData.title,
            priceMUR: tourData.priceMUR,
            priceEUR: tourData.priceEUR,
            currencyType: tourData.currencyType,
            bookingCurrency: bookingCurrency,
            isEuroAvailable: tourData.priceEUR > 0
          });
          setTour(tourData);
        }
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Failed to load tour details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTour();
  }, [id, bookingCurrency]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // In the handleSubmit function of TourPackageBookingConfirmation.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const submissionDate = getDateForSubmission();
    
    // Debug logging
    console.log('Submitting booking with data:', {
      packageTotal: calculatedPrices?.packageTotal,
      activitiesTotal: calculatedPrices?.activitiesTotal,
      transferTotal: calculatedPrices?.transferTotal,
      grandTotal: calculatedPrices?.grandTotal,
      hasActivities: activitiesData?.length || selectedActivities?.length || 0,
      includeTransfer
    });
    
    // Prepare booking data based on your actual database structure
    const bookingData = {
      tourPackageId: tourId,
      startDate: submissionDate,
      guests: parseInt(guests) || 1,
      fullName: formData.fullName || currentUser?.name || '',
      email: formData.email || currentUser?.email || '',
      phone: `${formData.countryCode}${formData.phone}`,
      specialRequests: formData.specialRequests || '',
      bookingReference: `TPB-${Math.floor(100000 + Math.random() * 900000)}`,
      currency: bookingCurrency,
      
      // Store the main totals (these should be in the booking currency)
      totalPrice: calculatedPrices?.grandTotal || 0,
      packagePrice: calculatedPrices?.packageTotal || 0,
      activitiesTotal: calculatedPrices?.activitiesTotal || 0,
      transferTotal: calculatedPrices?.transferTotal || 0,
      
      // Store EUR-specific fields
      totalPriceEur: bookingCurrency === 'EUR' ? (calculatedPrices?.grandTotal || 0) : 0,
      packagePriceEur: bookingCurrency === 'EUR' ? (calculatedPrices?.packageTotal || 0) : 0,
      activitiesTotalEur: bookingCurrency === 'EUR' ? (calculatedPrices?.activitiesTotal || 0) : 0,
      transferTotalEur: bookingCurrency === 'EUR' ? (calculatedPrices?.transferTotal || 0) : 0,
      
      // Store MUR-specific fields  
      totalPriceMur: bookingCurrency === 'MUR' ? (calculatedPrices?.grandTotal || 0) : 0,
      packagePriceMur: bookingCurrency === 'MUR' ? (calculatedPrices?.packageTotal || 0) : 0,
      activitiesTotalMur: bookingCurrency === 'MUR' ? (calculatedPrices?.activitiesTotal || 0) : 0,
      transferTotalMur: bookingCurrency === 'MUR' ? (calculatedPrices?.transferTotal || 0) : 0,
      
      status: 'pending',
      paymentStatus: 'pending',
      bookingSource: 'web'
    };

    // Add user if logged in
    if (currentUser) {
      bookingData.user = currentUser._id || currentUser.id;
    }

    // Activities data - store with price information
    if (activitiesData && activitiesData.length > 0) {
      bookingData.selectedActivities = activitiesData.map((activity) => ({
        activityId: activity._id || activity.activityId,
        title: activity.title,
        price: activity.price || 0,
        priceEur: activity.priceEur || 0,
        priceMUR: activity.priceMUR || 0,
        quantity: activity.quantity || guests,
        currency: activity.currency || bookingCurrency,
        duration: activity.duration || null,
        durationType: activity.durationType || null
      }));
    } else if (selectedActivities && selectedActivities.length > 0) {
      // Calculate activity prices if we only have selectedActivities
      bookingData.selectedActivities = selectedActivities.map((activity) => {
        const activityPrice = currencyHelpers.getActivityPrice(activity);
        return {
          activityId: activity._id || activity.activityId,
          title: activity.title,
          price: bookingCurrency === 'MUR' ? activityPrice : 0,
          priceEur: bookingCurrency === 'EUR' ? activityPrice : 0,
          priceMUR: bookingCurrency === 'MUR' ? activityPrice : 0,
          quantity: guests,
          currency: bookingCurrency,
          duration: activity.duration || null,
          durationType: activity.durationType || null
        };
      });
    }

    // Transfer data
    if (includeTransfer && transferDetails) {
      bookingData.airportTransferBooking = {
        transferId: transferDetails.transferId || transferDetails._id,
        transferName: transferDetails.transferName,
        transferCode: transferDetails.transferCode,
        vehicleType: transferDetails.vehicleType,
        tripType: transferDetails.tripType,
        transferType: transferDetails.transferType,
        transferPrice: calculatedPrices?.transferTotal || 0,
        currency: bookingCurrency,
      };
    }

    console.log('Final booking data being submitted:', bookingData);

    const response = await tourPackageBookingsAPI.create(bookingData);

    if (response?.data?.success) {
      navigate('/dashboard/tour-package-bookings', {
        state: {
          bookingReference: response.data.data.bookingReference,
          success: true,
          currency: bookingCurrency,
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/bookings');
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency) => {
    if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    }
    // Also update localStorage for consistency
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  // Currency switcher component
  const CurrencySwitcher = () => (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium text-gray-700">Currency:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => handleCurrencyChange('MUR')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currencyHelpers.currency === 'MUR'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          MUR (Rs)
        </button>
        <button
          type="button"
          onClick={() => handleCurrencyChange('EUR')}
          disabled={!tour || !tour.priceEUR || tour.priceEUR <= 0}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currencyHelpers.currency === 'EUR'
              ? 'bg-white text-yellow-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          } ${(!tour || !tour.priceEUR || tour.priceEUR <= 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={(!tour || !tour.priceEUR || tour.priceEUR <= 0) ? "EUR not available for this tour" : ""}
        >
          EUR (€)
        </button>
      </div>
    </div>
  );

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

  // Calculate totals using consistent helpers
  const tourPrice = currencyHelpers.getTourPrice(tour);
  const priceInfo = currencyHelpers.getDisplayPrice(tour);
  const tourTotal = tourPrice * formData.guests;
  const transferTotal = formData.includeTransfer && formData.transferDetails 
    ? parseFloat(formData.transferDetails.transferPrice) || 0 
    : 0;
  const grandTotal = tourTotal + calculateActivityTotal + transferTotal;
  const currencyBadge = currencyHelpers.getCurrencyBadgeInfo(tour);

  // Debug info
  console.log('Rendering with:', {
    bookingCurrency: currencyHelpers.currency,
    isEuro: currencyHelpers.isEuro,
    tourPrice,
    priceInfo,
    hasEURPrice: tour.priceEUR > 0,
    hasMURPrice: tour.priceMUR > 0
  });

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
              <i className={`fas fa-money-bill-wave mr-2 text-sm ${
                currencyHelpers.isEuro ? 'text-yellow-500' : 'text-green-500'
              }`}></i>
              <span className="text-sm font-medium text-blue-700">
                {currencyHelpers.getCurrencyDisplayName()}
              </span>
            </div>
          </div>
          
          {/* Currency Switcher - only show if onCurrencyChange is provided */}
          {onCurrencyChange && (
            <div className="mb-4">
              <CurrencySwitcher />
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
              <div>
                <p className="text-blue-800 font-medium">
                  Prices shown in {currencyHelpers.getCurrencyDisplayName()}
                  {currencyBadge.label && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${currencyBadge.bg} ${currencyBadge.text}`}>
                      <i className={`${currencyBadge.icon || 'fas fa-money-bill'} mr-1`}></i>
                      {currencyBadge.label}
                    </span>
                  )}
                </p>
                {priceInfo.hasAlternative && (
                  <p className="text-blue-600 text-xs mt-1">
                    <i className="fas fa-exchange-alt mr-1"></i>
                    Also available in {priceInfo.alternativeCurrency === 'EUR' ? '€' : 'Rs'}
                  </p>
                )}
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
                  {currencyBadge && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currencyBadge.bg} ${currencyBadge.text}`}>
                        <i className={`${currencyBadge.icon} mr-1`}></i>
                        {currencyBadge.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        currencyHelpers.isEuro 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        <i className={`fas fa-eye mr-1 ${
                          currencyHelpers.isEuro ? 'text-yellow-600' : 'text-green-600'
                        }`}></i>
                        Viewing in {currencyHelpers.currency}
                      </span>
                    </div>
                  )}
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
                   
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <i className={`fas fa-money-bill-wave mr-1 ${
                        priceInfo.currency === 'EUR' ? 'text-yellow-500' : 'text-green-500'
                      }`}></i>
                      {priceInfo.currency}
                    </div>
                    {priceInfo.hasAlternative && (
                      <div className="text-xs text-gray-500 mt-1">
                        <i className="fas fa-exchange-alt mr-1"></i>
                        {priceInfo.alternativeCurrency}: {
                          priceInfo.alternativeCurrency === 'EUR' 
                            ? `€ ${priceInfo.alternativePrice.toFixed(2)}`
                            : `Rs ${Math.round(priceInfo.alternativePrice)}`
                        }
                      </div>
                    )}
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
                              {currencyHelpers.formatCurrency(activityTotal, currencyHelpers.currency)}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center justify-end">
                              <i className={`fas fa-money-bill-wave mr-1 ${
                                currencyHelpers.isEuro ? 'text-yellow-500' : 'text-green-500'
                              }`}></i>
                              {currencyHelpers.currency}
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
                        {currencyHelpers.formatCurrency(calculateActivityTotal, currencyHelpers.currency)}
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
                        {currencyHelpers.formatCurrency(transferTotal, currencyHelpers.currency)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center justify-end">
                        <i className={`fas fa-money-bill-wave mr-1 ${
                          currencyHelpers.isEuro ? 'text-yellow-500' : 'text-green-500'
                        }`}></i>
                        {currencyHelpers.currency}
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
                
                {/* Currency switcher inside form */}
                {onCurrencyChange && (
                  <div className="mb-4">
                    <CurrencySwitcher />
                  </div>
                )}
                
                {/* Show warning if trying to book in EUR but EUR not available */}
                {currencyHelpers.isEuro && (!tour.priceEUR || tour.priceEUR <= 0) && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-yellow-800 text-sm">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      <span>This tour is not available in EUR. Please switch to MUR.</span>
                    </div>
                  </div>
                )}
                
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
                  <h4 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">Price Summary ({currencyHelpers.getCurrencyDisplayName()})</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tour × {formData.guests}</span>
                      <span>{currencyHelpers.formatCurrency(tourTotal, currencyHelpers.currency)}</span>
                    </div>
                    
                    {calculateActivityTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Activities</span>
                        <span>{currencyHelpers.formatCurrency(calculateActivityTotal, currencyHelpers.currency)}</span>
                      </div>
                    )}
                    
                    {transferTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Transfer</span>
                        <span>{currencyHelpers.formatCurrency(transferTotal, currencyHelpers.currency)}</span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-base">Total</span>
                        <span className="text-lg sm:text-xl font-bold text-blue-700">
                          {currencyHelpers.formatCurrency(grandTotal, currencyHelpers.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    type="submit"
                    disabled={submitting || (currencyHelpers.isEuro && (!tour.priceEUR || tour.priceEUR <= 0))}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm sm:text-base ${
                      submitting || (currencyHelpers.isEuro && (!tour.priceEUR || tour.priceEUR <= 0))
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white transition-colors`}
                    title={currencyHelpers.isEuro && (!tour.priceEUR || tour.priceEUR <= 0) ? "EUR booking not available for this tour" : ""}
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
                    onClick={() => navigate(`/tour-packages/${id}?currency=${currencyHelpers.currency}`)}
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
        currency={currencyHelpers.currencySymbol}
        tourImage={tour.image}
      />
    </div>
  );
};

export default TourPackageBookingRequest;