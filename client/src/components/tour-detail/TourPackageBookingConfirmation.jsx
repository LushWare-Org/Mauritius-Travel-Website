// src/pages/TourPackageBookingConfirmation.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tourPackageBookingsAPI, tourPackagesAPI } from '../../utils/api';

// Extract currency logic into a separate hook for consistency
const useBookingCurrency = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    // Priority: location state > URL param > localStorage > default
    let currency = location.state?.currency;

    if (!currency) {
      currency =
        searchParams.get('currency') ||
        localStorage.getItem('preferredCurrency') ||
        'MUR';
    }

    // Normalize ALL cases to 'MUR' or 'EUR' (uppercase)
    const normalized = currency.toString().toUpperCase().trim();

    if (normalized === 'EUR' || normalized === 'EURO' || normalized === '€') {
      console.log('useBookingCurrency - Normalized to EUR');
      return 'EUR';
    } else if (
      normalized === 'RS' ||
      normalized === 'MUR' ||
      normalized === 'RUPEES' ||
      normalized === '₹'
    ) {
      console.log('useBookingCurrency - Normalized to MUR');
      return 'MUR';
    } else {
      console.log('useBookingCurrency - Defaulting to MUR');
      return 'MUR';
    }
  }, [location.state, searchParams]);
};

const TourPackageBookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: tourId } = useParams();
  const { currentUser } = useAuth();

  // Use the custom hook for consistent currency handling
  const bookingCurrency = useBookingCurrency();
  const isEuro = bookingCurrency === 'EUR';

  // Extract state data
  const {
    selectedDate,
    guests = 1,
    selectedActivities = [],
    activitiesData = [],
    includeTransfer = false,
    transferDetails = null,
    totalPrice = 0,
    basePrice = 0,
    activitiesTotal = 0,
    transferTotal = 0,
    packageTotal = 0,
    currency: stateCurrency,
    currencySymbol: stateCurrencySymbol,
    tourPrices,
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
          year: 'numeric',
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

  // Fetch tour details with proper currency handling
  useEffect(() => {
    const fetchTourDetails = async () => {
      if (!tourId) return;

      try {
        setFetchingTour(true);

        const response = await tourPackagesAPI.getById(tourId);
        const tourData = response?.data?.data;

        if (tourData) {
          // Map database fields to consistent names
          const mappedTour = {
            ...tourData,
            priceMUR: parseFloat(
              tourData.priceMUR || tourData.priceRs || tourData.price || 0
            ),
            priceEUR: parseFloat(
              tourData.priceEUR || tourData.priceEur || tourData.priceEuro || 0
            ),
            currencyType:
              tourData.currencyType ||
              tourData.supportsCurrency ||
              (tourData.priceEUR > 0 && tourData.priceMUR > 0
                ? 'both'
                : tourData.priceEUR > 0
                ? 'eur-only'
                : 'rs-only'),
          };

          console.log('Tour data loaded for confirmation:', {
            id: mappedTour._id,
            title: mappedTour.title,
            priceMUR: mappedTour.priceMUR,
            priceEUR: mappedTour.priceEUR,
            currencyType: mappedTour.currencyType,
            bookingCurrency,
            hasEUR: mappedTour.priceEUR > 0,
          });

          setTour(mappedTour);
        }
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Failed to load tour details.');
      } finally {
        setFetchingTour(false);
      }
    };

    fetchTourDetails();
  }, [tourId, bookingCurrency]);

  // Memoized currency helpers - consistent with TourPackageListItem
  const currencyHelpers = useMemo(() => {
    const normalizedCurrency = bookingCurrency;
    const isEuroCurrency = normalizedCurrency === 'EUR';

    // Get display price function similar to TourPackageListItem
    const getDisplayPrice = (tourData) => {
      if (!tourData)
        return { display: '', price: 0, currency: normalizedCurrency };

      const priceMUR = parseFloat(
        tourData.priceMUR || tourData.priceRs || tourData.price || 0
      );
      const priceEUR = parseFloat(
        tourData.priceEUR || tourData.priceEur || tourData.priceEuro || 0
      );
      const currencyType =
        tourData.currencyType || tourData.supportsCurrency || 'rs-only';

      // Determine available currencies
      const isMurAvailable =
        currencyType === 'both' ||
        currencyType === 'rs-only' ||
        currencyType === 'mur-only';
      const isEurAvailable =
        currencyType === 'both' ||
        currencyType === 'eur-only' ||
        currencyType === 'euro-only';

      let displayPrice, displayCurrency;

      if (isEuroCurrency && isEurAvailable && priceEUR > 0) {
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
        hasAlternative:
          isMurAvailable && isEurAvailable && priceMUR > 0 && priceEUR > 0,
        alternativeCurrency: isEuroCurrency ? 'MUR' : 'EUR',
        alternativePrice: isEuroCurrency ? priceMUR : priceEUR,
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
      const duration =
        activity.duration || activity.durationType?.toLowerCase() || 'halfDay';
      const supportsDuration = activity.halfDayPrice || activity.fullDayPrice;

      if (supportsDuration) {
        // For EUR bookings
        if (isEuroCurrency) {
          if (duration.includes('half')) {
            // Use EUR-specific price or fallback to generic price
            return parseFloat(
              activity.halfDayPriceEur ||
                activity.halfDayPriceEUR ||
                activity.halfDayPrice ||
                0
            );
          }
          return parseFloat(
            activity.fullDayPriceEur ||
              activity.fullDayPriceEUR ||
              activity.fullDayPrice ||
              0
          );
        }
        // For MUR bookings
        else {
          if (duration.includes('half')) {
            return parseFloat(
              activity.halfDayPriceMUR ||
                activity.halfDayPriceRs ||
                activity.halfDayPrice ||
                0
            );
          }
          return parseFloat(
            activity.fullDayPriceMUR ||
              activity.fullDayPriceRs ||
              activity.fullDayPrice ||
              0
          );
        }
      } else {
        // No duration selection - use base price
        return isEuroCurrency
          ? parseFloat(
              activity.priceEur || activity.priceEUR || activity.price || 0
            )
          : parseFloat(
              activity.priceMUR || activity.priceRs || activity.price || 0
            );
      }
    };

    const getCurrencyBadgeInfo = (tourData) => {
      if (!tourData)
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          label: 'MUR Only',
          icon: 'fas fa-rupee-sign',
        };

      const currencyType = tourData.currencyType || tourData.supportsCurrency;
      const priceMUR = parseFloat(
        tourData.priceMUR || tourData.priceRs || tourData.price || 0
      );
      const priceEUR = parseFloat(
        tourData.priceEUR || tourData.priceEur || tourData.priceEuro || 0
      );

      // Similar logic to TourPackageListItem
      if (currencyType === 'both' && priceMUR > 0 && priceEUR > 0) {
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          text: 'text-green-800',
          label: 'Dual Currency',
          icon: 'fas fa-exchange-alt',
        };
      } else if (
        (currencyType === 'eur-only' || currencyType === 'euro-only') &&
        priceEUR > 0
      ) {
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
          text: 'text-yellow-800',
          label: '€ Only',
          icon: 'fas fa-euro-sign',
        };
      } else {
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-blue-200',
          text: 'text-blue-800',
          label: 'Rs Only',
          icon: 'fas fa-rupee-sign',
        };
      }
    };

    const getCurrencySymbol = () => (isEuroCurrency ? '€' : 'Rs');

    return {
      currency: normalizedCurrency,
      isEuro: isEuroCurrency,
      currencySymbol: getCurrencySymbol(),
      formatCurrency,
      getCurrencyDisplayName,
      getDisplayPrice,
      getTourPrice,
      getActivityPrice,
      getCurrencyBadgeInfo,
    };
  }, [bookingCurrency]);

  // Calculate prices based on state or recalculate
  useEffect(() => {
    if (!tour) return;

    let finalPackageTotal, finalActivitiesTotal, finalTransferTotal;

    // Use state values if available, otherwise calculate
    if (totalPrice > 0) {
      // We have state values, use them
      finalPackageTotal = packageTotal || basePrice * guests || 0;
      finalActivitiesTotal = activitiesTotal || 0;
      finalTransferTotal = transferTotal || 0;

      console.log('Using state prices:', {
        totalPrice,
        packageTotal: finalPackageTotal,
        activitiesTotal: finalActivitiesTotal,
        transferTotal: finalTransferTotal,
        currency: bookingCurrency,
      });
    } else {
      // Calculate from scratch
      const tourPrice = currencyHelpers.getTourPrice(tour);
      finalPackageTotal = tourPrice * guests;

      // Calculate activities total
      if (activitiesData && activitiesData.length > 0) {
        finalActivitiesTotal = activitiesData.reduce((sum, activity) => {
          const activityPrice = currencyHelpers.getActivityPrice(activity);
          const quantity = activity.quantity || guests;
          return sum + activityPrice * quantity;
        }, 0);
      } else if (selectedActivities && selectedActivities.length > 0) {
        finalActivitiesTotal = selectedActivities.reduce((sum, activity) => {
          const activityPrice = currencyHelpers.getActivityPrice(activity);
          const quantity = activity.quantity || guests;
          return sum + activityPrice * quantity;
        }, 0);
      } else {
        finalActivitiesTotal = 0;
      }

      // Calculate transfer total
      if (includeTransfer && transferDetails) {
        finalTransferTotal = parseFloat(transferDetails.transferPrice) || 0;
      } else {
        finalTransferTotal = 0;
      }

      console.log('Calculated prices:', {
        tourPrice,
        finalPackageTotal,
        finalActivitiesTotal,
        finalTransferTotal,
        currency: bookingCurrency,
      });
    }

    const grandTotal =
      finalPackageTotal + finalActivitiesTotal + finalTransferTotal;

    setCalculatedPrices({
      packageTotal: finalPackageTotal,
      activitiesTotal: finalActivitiesTotal,
      transferTotal: finalTransferTotal,
      grandTotal,
      formattedGrandTotal: currencyHelpers.formatCurrency(grandTotal),
      guests: parseInt(guests) || 1,
      currency: bookingCurrency,
    });
  }, [
    tour,
    selectedActivities,
    activitiesData,
    includeTransfer,
    transferDetails,
    guests,
    currencyHelpers,
    totalPrice,
    packageTotal,
    activitiesTotal,
    transferTotal,
    basePrice,
    bookingCurrency,
  ]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const submissionDate = getDateForSubmission();
    
    // Prepare booking data
    const bookingData = {
      tourPackageId: tourId,  // Make sure this is tourPackageId (not tourPackage)
      startDate: submissionDate,
      guests: parseInt(guests) || 1,
      fullName: formData.fullName || currentUser?.name || '',
      email: formData.email || currentUser?.email || '',
      phone: `${formData.countryCode}${formData.phone}`,
      specialRequests: formData.specialRequests || '',
      // Use calculatedPrices from state
      totalPrice: calculatedPrices?.grandTotal || 0,
      packagePrice: calculatedPrices?.packageTotal || 0,
      activitiesTotal: calculatedPrices?.activitiesTotal || 0,
      transferTotal: calculatedPrices?.transferTotal || 0,
      currency: bookingCurrency,
      
      // Activities data - include price information
      selectedActivities: (activitiesData.length > 0 ? activitiesData : selectedActivities).map(activity => ({
        activityId: activity._id || activity.activityId,
        title: activity.title,
        price: isEuro ? 
          (activity.priceEur || activity.priceEUR || activity.price || 0) : 
          (activity.priceMUR || activity.priceRs || activity.price || 0),
        priceEur: isEuro ? 
          (activity.priceEur || activity.priceEUR || activity.price || 0) : 0,
        quantity: activity.quantity || guests,
        duration: activity.duration || null,
        durationType: activity.durationType || null
      })),
      
      // Transfer data if included
      ...(includeTransfer && transferDetails && {
        airportTransferBooking: {
          transferId: transferDetails.transferId || transferDetails._id,
          transferName: transferDetails.transferName,
          transferPrice: calculatedPrices?.transferTotal || 0,
          currency: bookingCurrency,
          ...transferDetails
        }
      })
    };

    console.log('📤 Sending booking data to /with-activities endpoint:', {
      totalPrice: bookingData.totalPrice,
      activitiesTotal: bookingData.activitiesTotal,
      transferTotal: bookingData.transferTotal,
      selectedActivitiesCount: bookingData.selectedActivities.length,
      endpoint: '/api/v1/tour-package-bookings/with-activities'
    });

    // IMPORTANT: Call the correct endpoint
    const response = await tourPackageBookingsAPI.createWithActivities(bookingData);
    
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
    console.error('Error creating booking:', err);
    setError(
      err.response?.data?.message || 'An error occurred. Please try again.'
    );
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
            <h2 className="text-lg sm:text-xl font-bold text-red-700">
              Booking Information Missing
            </h2>
          </div>
          <p className="text-red-600 mb-4">
            Please go back and select your booking options.
          </p>
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

  const priceInfo = currencyHelpers.getDisplayPrice(tour);
  const currencyBadge = currencyHelpers.getCurrencyBadgeInfo(tour);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-6">
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-1">
                Complete Your Booking
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Review details and confirm booking
              </p>
            </div>
            <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
              <i
                className={`fas fa-money-bill-wave mr-2 text-sm ${
                  bookingCurrency === 'EUR'
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}
              ></i>
              <span className="text-sm font-medium text-blue-700">
                {bookingCurrency === 'EUR'
                  ? 'Euros (€)'
                  : 'Mauritian Rupees (Rs)'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
              <div>
                <p className="text-blue-800 font-medium">
                  Prices shown in{' '}
                  {bookingCurrency === 'EUR'
                    ? 'Euros (€)'
                    : 'Mauritian Rupees (Rs)'}
                  {currencyBadge.label && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${currencyBadge.bg} ${currencyBadge.text}`}
                    >
                      <i
                        className={`${
                          currencyBadge.icon || 'fas fa-money-bill'
                        } mr-1`}
                      ></i>
                      {currencyBadge.label}
                    </span>
                  )}
                </p>
                {priceInfo.hasAlternative && (
                  <p className="text-blue-600 text-xs mt-1">
                    <i className="fas fa-exchange-alt mr-1"></i>
                    Also available in{' '}
                    {priceInfo.alternativeCurrency === 'EUR' ? '€' : 'Rs'}
                  </p>
                )}
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currencyBadge.bg} ${currencyBadge.text}`}
                    >
                      <i className={`${currencyBadge.icon} mr-1`}></i>
                      {currencyBadge.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bookingCurrency === 'EUR'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <i
                        className={`fas fa-eye mr-1 ${
                          bookingCurrency === 'EUR'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      ></i>
                      Viewing in {bookingCurrency}
                    </span>
                  </div>
                </div>
                <div className="sm:w-3/4">
                  <h3 className="text-xl font-bold text-blue-700 mb-2">
                    {tour.title}
                  </h3>

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
                        <div className="text-xs text-gray-500">
                          Package Price per person
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-blue-700">
                          {priceInfo.display}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {guests} guest(s) × {priceInfo.display}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg sm:text-xl font-bold text-blue-800">
                          {currencyHelpers.formatCurrency(
                            calculatedPrices.packageTotal
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Package Total
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Activities */}
            {calculatedPrices.activitiesTotal > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-hiking mr-2 text-green-500"></i>
                  Selected Activities
                </h2>

                <div className="space-y-3">
                  {(activitiesData.length > 0
                    ? activitiesData
                    : selectedActivities
                  ).map((activity, index) => {
                    const activityPrice =
                      currencyHelpers.getActivityPrice(activity);
                    const quantity = activity.quantity || guests;
                    const activityTotal = activityPrice * quantity;
                    const duration = activity.duration || activity.durationType;

                    return (
                      <div
                        key={activity._id || activity.activityId || index}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                                {activity.title}
                              </h4>
                              {duration && (
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    duration.includes('half')
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {duration.includes('half')
                                    ? 'Half Day'
                                    : 'Full Day'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {quantity} guest{quantity > 1 ? 's' : ''}
                            </div>
                            <div className="mt-2 flex items-center text-xs">
                              <span
                                className={`px-2 py-1 rounded ${currencyBadge.bg} ${currencyBadge.text}`}
                              >
                                {currencyBadge.label}
                              </span>
                              <span className="ml-2 text-blue-600">
                                {bookingCurrency}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-bold text-green-600">
                              {currencyHelpers.formatCurrency(activityTotal)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {currencyHelpers.formatCurrency(activityPrice)}{' '}
                              each
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
                        {currencyHelpers.formatCurrency(
                          calculatedPrices.activitiesTotal
                        )}
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
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                        {transferDetails.transferName}
                      </h4>
                      <div className="space-y-1 mt-2 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-600">
                          <i className="fas fa-car mr-2 text-gray-400"></i>
                          {transferDetails.vehicleType} •{' '}
                          {transferDetails.transferCode}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <i className="fas fa-route mr-2 text-gray-400"></i>
                          {transferDetails.tripType === 'one-way'
                            ? 'One Way'
                            : 'Round Trip'}
                        </div>
                        <div className="flex items-center text-blue-600 text-xs">
                          <i className="fas fa-money-bill-wave mr-2"></i>
                          {bookingCurrency}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold text-purple-600">
                        {currencyHelpers.formatCurrency(
                          calculatedPrices.transferTotal
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transferDetails.tripType === 'one-way'
                          ? 'One Way'
                          : 'Round Trip'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Booking Summary - Placed immediately before the form */}
            <div className="lg:hidden bg-white rounded-xl shadow-sm p-4 mb-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4">
                Booking Summary
              </h3>

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
                    {selectedActivities?.length || activitiesData?.length || 0}{' '}
                    selected
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
                  <span
                    className={`font-medium px-2 py-1 rounded text-xs ${
                      bookingCurrency === 'EUR'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <i
                      className={`fas fa-money-bill-wave mr-1 ${
                        bookingCurrency === 'EUR'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    ></i>
                    {bookingCurrency}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                  Price Breakdown
                </h4>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour Package:</span>
                    <span className="font-medium">
                      {currencyHelpers.formatCurrency(
                        calculatedPrices.packageTotal
                      )}
                    </span>
                  </div>

                  {calculatedPrices.activitiesTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activities:</span>
                      <span className="font-medium">
                        {currencyHelpers.formatCurrency(
                          calculatedPrices.activitiesTotal
                        )}
                      </span>
                    </div>
                  )}

                  {calculatedPrices.transferTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airport Transfer:</span>
                      <span className="font-medium">
                        {currencyHelpers.formatCurrency(
                          calculatedPrices.transferTotal
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Amount */}
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800 text-base">
                        Total Amount:
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        For {guests} guest(s) in {bookingCurrency}
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
                        setFormData({
                          ...formData,
                          countryCode: e.target.value,
                        })
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
                    {selectedActivities?.length || activitiesData?.length || 0}{' '}
                    selected
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
                  <span
                    className={`font-medium px-2 py-1 rounded text-xs ${
                      bookingCurrency === 'EUR'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <i
                      className={`fas fa-money-bill-wave mr-1 ${
                        bookingCurrency === 'EUR'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    ></i>
                    {bookingCurrency}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Price Breakdown
                </h4>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tour Package:</span>
                    <span className="font-medium">
                      {currencyHelpers.formatCurrency(
                        calculatedPrices.packageTotal
                      )}
                    </span>
                  </div>

                  {calculatedPrices.activitiesTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activities:</span>
                      <span className="font-medium">
                        {currencyHelpers.formatCurrency(
                          calculatedPrices.activitiesTotal
                        )}
                      </span>
                    </div>
                  )}

                  {calculatedPrices.transferTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Airport Transfer:</span>
                      <span className="font-medium">
                        {currencyHelpers.formatCurrency(
                          calculatedPrices.transferTotal
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total Amount */}
                <div className="pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">
                      Total Amount:
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {calculatedPrices.formattedGrandTotal}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        For {guests} guest(s) in {bookingCurrency}
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
