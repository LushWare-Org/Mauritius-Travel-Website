import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ActivitySelector from './ActivitySelector';
import { activitiesAPI, airportTransferAPI, tourPackagesAPI } from '../../utils/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  FaCalendarAlt,
  FaUsers,
  FaPlus,
  FaMinus,
  FaChevronDown,
  FaChevronUp,
  FaPlane,
  FaClock,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaArrowRight,
  FaRegClock,
  FaExchangeAlt,
  FaLongArrowAltRight,
  FaEuroSign,
} from 'react-icons/fa';
import {
  currencyConfig,
  getCurrencySymbol,
  formatPrice,
  getBookingCurrency,
  formatBookingPrice,
  getCurrencyName,
  calculateTransferPrice,
  getAlternativePrice
} from '../../utils/currency';

const TourPackageBookingForm = ({
  tour,
  userCurrency = 'MUR',
  priceDisplay,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Read currency from multiple sources with priority
  const searchParams = new URLSearchParams(location.search);
  const urlCurrency = searchParams.get('currency');
  
  // Initialize currency with priority: URL > Props > localStorage > Default
  const [currency, setCurrency] = useState(() => {
    const storedCurrency = localStorage.getItem('currentCurrency');
    return urlCurrency || userCurrency || storedCurrency || 'MUR';
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedActivitiesDetails, setSelectedActivitiesDetails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [tourPrices, setTourPrices] = useState({
    MUR: priceDisplay?.price || Number(tour.price) || 0,
    EUR: Number(tour.priceEur) || 0
  });

  // Activity State
  const [activityDurations, setActivityDurations] = useState({});
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState('');

  // Airport Transfer State
  const [includeTransfer, setIncludeTransfer] = useState(false);
  const [availableTransfers, setAvailableTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferTripType, setTransferTripType] = useState('one-way');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [transferType, setTransferType] = useState('airport-to-hotel');
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  // Always use 1 guest (default)
  const guests = 1;
  const basePricePerPerson = tourPrices[currency] || tourPrices.MUR;
  const [totalPrice, setTotalPrice] = useState(basePricePerPerson * guests);

  // Sync currency when URL changes (user navigates with currency in URL)
  useEffect(() => {
    if (urlCurrency && urlCurrency !== currency) {
      setCurrency(urlCurrency);
    }
  }, [urlCurrency]);

  // Update localStorage and URL when currency changes
  useEffect(() => {
    // Save to localStorage for synchronization
    localStorage.setItem('currentCurrency', currency);
    
    // Update URL if it doesn't match current currency
    if (urlCurrency !== currency) {
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('currency', currency);
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [currency]);

  // Handle currency change
  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency !== currency) {
      setCurrency(newCurrency);
      
      // Update URL
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('currency', newCurrency);
      navigate({ search: newSearchParams.toString() }, { replace: true });
      
      // Save to localStorage
      localStorage.setItem('currentCurrency', newCurrency);
      localStorage.setItem('preferredCurrency', newCurrency);
      
      // Re-fetch activities with new currency
      if (selectedActivities.length > 0) {
        const fetchActivitiesWithNewCurrency = async () => {
          try {
            const response = await activitiesAPI.getAll({ currency: newCurrency });
            if (response.data.success) {
              const details = response.data.data.filter((activity) =>
                selectedActivities.includes(activity._id)
              );
              setSelectedActivitiesDetails(details);
            }
          } catch (error) {
            console.error('Error fetching activities with new currency:', error);
          }
        };
        fetchActivitiesWithNewCurrency();
      }
    }
  };

  // Fetch tour package prices in both currencies on mount
  useEffect(() => {
    const fetchTourPrices = async () => {
      try {
        if (tour.priceEur !== undefined) {
          setTourPrices(prev => ({
            ...prev,
            EUR: Number(tour.priceEur) || 0
          }));
        } else {
          const response = await tourPackagesAPI.getById(tour._id);
          if (response.data.success && response.data.data) {
            const tourData = response.data.data;
            setTourPrices({
              MUR: Number(tourData.price) || 0,
              EUR: Number(tourData.priceEur) || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching tour prices:', error);
      }
    };

    fetchTourPrices();
  }, [tour]);

  // Function to normalize transfer prices
  const normalizeTransferPrices = (transfer) => {
    if (!transfer) return transfer;
    
    return {
      ...transfer,
      oneWayPriceMUR: transfer.oneWayPriceMUR || transfer.priceMUR || transfer.price || 0,
      roundTripPriceMUR: transfer.roundTripPriceMUR || 
                        (transfer.priceMUR ? transfer.priceMUR * 2 : 0) || 
                        (transfer.price ? transfer.price * 2 : 0) || 
                        0,
      oneWayPriceEUR: transfer.oneWayPriceEUR || transfer.priceEUR || 0,
      roundTripPriceEUR: transfer.roundTripPriceEUR || 
                       (transfer.priceEUR ? transfer.priceEUR * 2 : 0) || 
                       0,
    };
  };

  // Fetch airport transfers
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoadingTransfers(true);
        const response = await airportTransferAPI.getActive();
        
        if (response.data.success) {
          const transfers = response.data.data;
          const normalizedTransfers = transfers.map(normalizeTransferPrices);
          setAvailableTransfers(normalizedTransfers);
          
          if (normalizedTransfers.length > 0) {
            setSelectedTransfer(normalizedTransfers[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching transfers:', error);
      } finally {
        setLoadingTransfers(false);
      }
    };
    
    fetchTransfers();
  }, []);

  // Fetch all activities with current currency
  useEffect(() => {
    const fetchAllActivities = async () => {
      try {
        const response = await activitiesAPI.getAll({ currency });
        if (response.data.success) {
          const allActivities = response.data.data || [];

          const initialDurations = {};
          allActivities.forEach((activity) => {
            if (activity.halfDayPrice || activity.fullDayPrice) {
              initialDurations[activity._id] = 'halfDay';
            }
          });
          setActivityDurations(initialDurations);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };
    fetchAllActivities();
  }, [currency]);

  // Update selected activities details when currency changes
  useEffect(() => {
    if (selectedActivities.length === 0) {
      setSelectedActivitiesDetails([]);
      return;
    }

    const fetchActivityDetails = async () => {
      try {
        const response = await activitiesAPI.getAll({ currency });
        if (response.data.success) {
          const details = response.data.data.filter((activity) =>
            selectedActivities.includes(activity._id)
          );
          setSelectedActivitiesDetails(details);
        }
      } catch (error) {
        console.error('Error fetching activity details:', error);
      }
    };

    fetchActivityDetails();
  }, [selectedActivities, currency]);

  // Check if activity supports duration selection
  const showDurationSelection = (activity) => {
    return (
      activity.halfDayPrice ||
      activity.fullDayPrice ||
      (currency === 'EUR' && (activity.halfDayPriceEUR || activity.fullDayPriceEUR)) ||
      (currency === 'MUR' && (activity.halfDayPriceMUR || activity.fullDayPriceMUR))
    );
  };

  // Get activity price based on duration and currency
  const getActivityPrice = (activity) => {
    let price = 0;
    const supportsDuration = showDurationSelection(activity);

    if (supportsDuration) {
      const duration = activityDurations[activity._id] || 'halfDay';
      
      if (currency === 'EUR') {
        if (duration === 'halfDay') {
          price = activity.halfDayPriceEUR !== undefined
            ? Number(activity.halfDayPriceEUR)
            : Number(activity.halfDayPrice || 0);
        } else {
          price = activity.fullDayPriceEUR !== undefined
            ? Number(activity.fullDayPriceEUR)
            : Number(activity.fullDayPrice || 0);
        }
      } else {
        if (duration === 'halfDay') {
          price = activity.halfDayPriceMUR !== undefined
            ? Number(activity.halfDayPriceMUR)
            : Number(activity.halfDayPrice || 0);
        } else {
          price = activity.fullDayPriceMUR !== undefined
            ? Number(activity.fullDayPriceMUR)
            : Number(activity.fullDayPrice || 0);
        }
      }
    } else {
      if (currency === 'EUR') {
        price = activity.priceEUR !== undefined
          ? Number(activity.priceEUR)
          : Number(activity.price || 0);
      } else {
        price = activity.priceMUR !== undefined
          ? Number(activity.priceMUR)
          : Number(activity.price || 0);
      }
    }

    return price;
  };

  // Get duration price for display
  const getDurationPriceDisplay = (activity, durationType) => {
    let price = 0;

    if (currency === 'EUR') {
      const eurField = durationType === 'halfDay' ? 'halfDayPriceEUR' : 'fullDayPriceEUR';
      const regularField = durationType === 'halfDay' ? 'halfDayPrice' : 'fullDayPrice';

      price = activity[eurField] !== undefined
        ? Number(activity[eurField])
        : Number(activity[regularField] || 0);
    } else {
      const murField = durationType === 'halfDay' ? 'halfDayPriceMUR' : 'fullDayPriceMUR';
      const regularField = durationType === 'halfDay' ? 'halfDayPrice' : 'fullDayPrice';

      price = activity[murField] !== undefined
        ? Number(activity[murField])
        : Number(activity[regularField] || 0);
    }

    return formatPrice(price, currency);
  };

  // Handle duration change
  const handleDurationChange = (activityId, duration) => {
    setActivityDurations((prev) => ({
      ...prev,
      [activityId]: duration,
    }));
  };

  // Get transfer price based on trip type and currency
  const getTransferPrice = (transfer) => {
    if (!transfer) return 0;
    
    const price = calculateTransferPrice(transfer, transferTripType, currency);
    return price;
  };

  // Price calculation
  useEffect(() => {
    const calculateTotalPrice = () => {
      const packageTotal = basePricePerPerson * guests;

      let activitiesTotal = 0;
      if (selectedActivitiesDetails.length > 0) {
        activitiesTotal = selectedActivitiesDetails.reduce((sum, activity) => {
          const activityPrice = getActivityPrice(activity);
          return sum + activityPrice * guests;
        }, 0);
      }

      let transferTotal = 0;
      if (includeTransfer && selectedTransfer) {
        transferTotal = getTransferPrice(selectedTransfer);
      }

      const total = packageTotal + activitiesTotal + transferTotal;
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [
    guests,
    basePricePerPerson,
    selectedActivitiesDetails,
    activityDurations,
    includeTransfer,
    selectedTransfer,
    transferTripType,
    currency
  ]);

  // Handle trip type change
  const handleTripTypeChange = (type) => {
    setTransferTripType(type);
  };

  // Handle form submission
  // In the handleSubmit function of TourPackageBookingForm.jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  if (isSubmitting) return;

  if (!selectedDate) {
    alert('Please select a date');
    return;
  }

  if (includeTransfer && !selectedTransfer) {
    alert('Please select an airport transfer');
    return;
  }

  setIsSubmitting(true);

  try {
    const finalPackageTotal = basePricePerPerson * guests;
    const finalActivitiesTotal = selectedActivitiesDetails.reduce(
      (sum, activity) => {
        const activityPrice = getActivityPrice(activity);
        return sum + activityPrice * guests;
      },
      0
    );

    let finalTransferTotal = 0;
    let transferDetails = null;
    if (includeTransfer && selectedTransfer) {
      finalTransferTotal = getTransferPrice(selectedTransfer);
      
      if (finalTransferTotal <= 0) {
        alert(`Transfer price calculation error. Please contact support. Price: ${finalTransferTotal}`);
        setIsSubmitting(false);
        return;
      }
      
      transferDetails = {
        transferId: selectedTransfer._id,
        transferName: selectedTransfer.airportName,
        transferCode: selectedTransfer.airportCode,
        vehicleType: selectedTransfer.vehicleType,
        tripType: transferTripType,
        transferType: transferType,
        transferPrice: finalTransferTotal,
        currency: currency,
        rawPrices: {
          oneWayPriceMUR: selectedTransfer.oneWayPriceMUR,
          roundTripPriceMUR: selectedTransfer.roundTripPriceMUR,
          oneWayPriceEUR: selectedTransfer.oneWayPriceEUR,
          roundTripPriceEUR: selectedTransfer.roundTripPriceEUR
        }
      };
    }

    const finalTotal = finalPackageTotal + finalActivitiesTotal + finalTransferTotal;

    // Debug logging
    console.log('Price calculations before navigation:', {
      packageTotal: finalPackageTotal,
      activitiesTotal: finalActivitiesTotal,
      transferTotal: finalTransferTotal,
      totalPrice: finalTotal,
      currency: currency,
      hasActivities: selectedActivitiesDetails.length > 0,
      hasTransfer: includeTransfer
    });

    // Prepare activities data
    const activitiesDataForSubmission = selectedActivitiesDetails.map(
      (activity) => {
        const activityPrice = getActivityPrice(activity);
        return {
          activityId: activity._id,
          activity: activity._id,
          title: activity.title,
          price: currency === 'MUR' ? activityPrice : 0,
          priceEur: currency === 'EUR' ? activityPrice : 0,
          priceMUR: currency === 'MUR' ? activityPrice : 0,
          quantity: guests,
          currency: currency,
          duration: showDurationSelection(activity)
            ? activityDurations[activity._id]
            : null,
          durationType: showDurationSelection(activity)
            ? activityDurations[activity._id] === 'halfDay'
              ? 'Half Day'
              : 'Full Day'
            : null,
        };
      }
    );

    // Format date
    const getFormattedDate = (date) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedSelectedDate = getFormattedDate(selectedDate);

    // Navigate with ALL necessary data
    navigate(`/tour-package-booking-confirmation/${tour._id || tour.id}`, {
      state: {
        selectedDate: formattedSelectedDate,
        guests,
        selectedActivities: selectedActivitiesDetails,
        activitiesData: activitiesDataForSubmission,
        includeTransfer,
        transferDetails,
        totalPrice: finalTotal,
        basePrice: basePricePerPerson,
        activitiesTotal: finalActivitiesTotal,
        transferTotal: finalTransferTotal,
        packageTotal: finalPackageTotal,
        currency: currency,
        currencySymbol: getCurrencySymbol(currency),
        // Store currency-specific totals
        totalPriceEur: currency === 'EUR' ? finalTotal : 0,
        packagePriceEur: currency === 'EUR' ? finalPackageTotal : 0,
        activitiesTotalEur: currency === 'EUR' ? finalActivitiesTotal : 0,
        transferTotalEur: currency === 'EUR' ? finalTransferTotal : 0,
        // Store MUR-specific totals
        totalPriceMur: currency === 'MUR' ? finalTotal : 0,
        packagePriceMur: currency === 'MUR' ? finalPackageTotal : 0,
        activitiesTotalMur: currency === 'MUR' ? finalActivitiesTotal : 0,
        transferTotalMur: currency === 'MUR' ? finalTransferTotal : 0,
        tourPrices: tourPrices
      },
    });
  } catch (error) {
    console.error('Error preparing submission:', error);
    alert('Error preparing booking. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  // Format date display
  const formatDateDisplay = (date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle activity selection change
  const handleActivitiesChange = (activityIds) => {
    setSelectedActivities(activityIds);
  };

  // Calculate totals
  const packageTotal = basePricePerPerson * guests;
  const activitiesTotal = selectedActivitiesDetails.reduce((sum, activity) => {
    const activityPrice = getActivityPrice(activity);
    return sum + activityPrice * guests;
  }, 0);

  const transferTotal = includeTransfer && selectedTransfer
    ? getTransferPrice(selectedTransfer)
    : 0;

  // Helper functions for date selection
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    return maxDate;
  };

  const isDateAvailable = (date) => {
    return true;
  };

  const filterPassedDates = (date) => {
    return isDateAvailable(date);
  };

  // Check if EUR is available for this tour
  const isEuroAvailable = tourPrices.EUR > 0 || tour.supportsCurrency === 'both' || tour.supportsCurrency === 'eur-only';

  return (
    <>
      {/* Activity Selection Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-4 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Select Activities
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Enhance your tour experience
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="mr-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                      Prices in {getCurrencyName(currency)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="mt-4 flex gap-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-300 flex items-center gap-1 text-sm">
                  <FaFilter className="text-xs" />
                  Filter
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ActivitySelector
                selectedActivities={selectedActivities}
                onActivitiesChange={handleActivitiesChange}
                guests={guests}
                filter={activityFilter}
                activityDurations={activityDurations}
                onDurationChange={handleDurationChange}
                userCurrency={currency === 'EUR' ? 'euro' : 'rs'}
              />
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <div className="text-xs text-gray-600">
                    Selected Activities
                  </div>
                  <div className="font-bold">
                    {selectedActivities.length} activities
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Prices in {getCurrencyName(currency)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowActivityModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowActivityModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    Done Selecting
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Booking Form */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Book This Tour</h2>
              <p className="opacity-90 text-xs mt-1">
                Secure your spot with instant confirmation
              </p>
              <div className="flex items-center mt-2">
                {/* Currency Selector - Auto-sync with TourPackages */}
                <div className="flex bg-white/20 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('MUR')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${currency === 'MUR' 
                      ? 'bg-white text-blue-700' 
                      : 'text-white hover:bg-white/20'
                    }`}
                  >
                    Rs (MUR)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('EUR')}
                    disabled={!isEuroAvailable}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${currency === 'EUR' 
                      ? 'bg-white text-blue-700' 
                      : isEuroAvailable ? 'text-white hover:bg-white/20' : 'text-white/50 cursor-not-allowed'
                    }`}
                    title={!isEuroAvailable ? "EUR not available for this tour" : ""}
                  >
                    € (EUR)
                  </button>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPrice(basePricePerPerson, currency)}
              </div>
              <div className="text-xs opacity-90">per person</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Currency Notice */}
          {currency === 'EUR' && !isEuroAvailable && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                <FaEuroSign className="inline mr-1" />
                EUR pricing is estimated. Final amount may vary.
              </p>
            </div>
          )}

          {/* Date Selection */}
          <div className="relative">
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              <FaCalendarAlt className="inline mr-1.5 text-blue-500 text-base" />
              Select Date
            </label>

            {/* Custom Calendar Button */}
            <button
              type="button"
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group cursor-pointer flex items-center justify-between mb-2"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                  <FaCalendarAlt className="text-blue-600 text-lg" />
                </div>
                <div className="text-left">
                  <span
                    className={`font-medium text-sm ${selectedDate ? 'text-gray-900' : 'text-gray-600'}`}
                  >
                    {selectedDate
                      ? formatDateDisplay(selectedDate)
                      : 'Choose your tour date'}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {selectedDate
                      ? 'Click to change date'
                      : 'Click calendar icon to select'}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <FaChevronDown
                  className={`text-blue-500 text-sm transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Hidden DatePicker */}
            {calendarOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1">
                <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">Select Date</h3>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                    inline
                    minDate={getTomorrow()}
                    maxDate={getMaxDate()}
                    filterDate={filterPassedDates}
                    dateFormat="MMM d, yyyy"
                    calendarClassName="!border-0"
                  />
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                      <span>Available dates</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(false)}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
                    >
                      Close Calendar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Date Display */}
            {selectedDate && !calendarOpen && (
              <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-1.5 rounded-full mr-2">
                      <FaCheck className="text-green-600 text-xs" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">
                        Date Selected: {formatDateDisplay(selectedDate)}
                      </div>
                      <div className="text-green-600 text-xs font-medium">
                        ✓ This date is available for booking
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(null);
                      setCalendarOpen(false);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Activities with Duration Selection */}
          {selectedActivitiesDetails.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center">
                  <FaClock className="text-blue-500 mr-1.5 text-xs" />
                  Selected Activities
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {selectedActivities.length}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({getCurrencySymbol(currency)})
                  </span>
                </h3>
              </div>

              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {selectedActivitiesDetails.map((activity) => {
                  const price = getActivityPrice(activity);
                  const activityTotal = price * guests;
                  const supportsDuration = showDurationSelection(activity);

                  return (
                    <div key={activity._id} className="p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-sm">
                            {activity.title}
                          </div>
                          <div className="text-gray-600 text-xs mt-0.5">
                            {activity.description?.substring(0, 60)}...
                          </div>

                          {/* Duration Selection for Activities */}
                          {supportsDuration && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <FaRegClock className="text-blue-500 text-xs" />
                                <span className="text-xs font-medium text-gray-700">
                                  Duration:
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDurationChange(
                                        activity._id,
                                        'halfDay'
                                      )
                                    }
                                    className={`px-2 py-1 text-xs rounded transition-colors ${activityDurations[activity._id] === 'halfDay'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                  >
                                    Half Day
                                    {activity.halfDayPrice && (
                                      <span className="ml-1 font-semibold">
                                        (
                                        {getDurationPriceDisplay(
                                          activity,
                                          'halfDay'
                                        )}
                                        )
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDurationChange(
                                        activity._id,
                                        'fullDay'
                                      )
                                    }
                                    className={`px-2 py-1 text-xs rounded transition-colors ${activityDurations[activity._id] === 'fullDay'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                  >
                                    Full Day
                                    {activity.fullDayPrice && (
                                      <span className="ml-1 font-semibold">
                                        (
                                        {getDurationPriceDisplay(
                                          activity,
                                          'fullDay'
                                        )}
                                        )
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-right ml-3">
                          <div className="font-bold text-gray-900 text-sm">
                            {formatPrice(activityTotal, currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(price, currency)}
                          </div>
                          {supportsDuration && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              {activityDurations[activity._id] === 'halfDay'
                                ? 'Half Day'
                                : 'Full Day'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowActivityModal(true)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Edit Activities
                  </button>
                  <div className="text-sm font-bold text-gray-800">
                    Activities Total: {formatPrice(activitiesTotal, currency)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Activities Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowActivityModal(true)}
              className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              <div className="flex items-center justify-center">
                <FaPlus className="mr-2 text-xs" />
                {selectedActivities.length > 0
                  ? 'Add More Activities'
                  : 'Add Activities to Your Tour'}
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Customize your experience with optional activities
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Prices in {getCurrencyName(currency)}
              </p>
            </button>
          </div>

          {/* Airport Transfer Section */}
          <div className="border border-gray-200 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaPlane className="text-blue-500 mr-2 text-xs" />
                <div>
                  <h3 className="font-medium text-gray-800 text-xs">
                    Airport Transfer
                  </h3>
                  <p className="text-gray-500 text-[10px]">
                    Optional transportation ({getCurrencySymbol(currency)})
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTransfer}
                  onChange={(e) => setIncludeTransfer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-300 peer-checked:bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
              </label>
            </div>

            {includeTransfer && (
              <div className="mt-2 space-y-2">
                {/* Trip Type Selection */}
                <div>
                  <div className="flex items-center text-[10px] text-gray-600 mb-1.5">
                    <FaExchangeAlt className="text-blue-500 mr-1 text-xs" />
                    <span className="font-medium">Trip Type</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTripTypeChange('one-way')}
                      className={`p-1.5 rounded border transition-all flex items-center justify-center ${transferTripType === 'one-way'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <FaLongArrowAltRight
                        className={`mr-1 text-xs ${transferTripType === 'one-way'
                            ? 'text-blue-600'
                            : 'text-gray-500'
                          }`}
                      />
                      <span className="text-xs font-medium">One Way</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTripTypeChange('round-trip')}
                      className={`p-1.5 rounded border transition-all flex items-center justify-center ${transferTripType === 'round-trip'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <FaExchangeAlt
                        className={`mr-1 text-xs ${transferTripType === 'round-trip'
                            ? 'text-blue-600'
                            : 'text-gray-500'
                          }`}
                      />
                      <span className="text-xs font-medium">Round Trip</span>
                    </button>
                  </div>
                </div>

                {/* Transfer Selection */}
                <div>
                  <div className="text-[10px] font-medium text-gray-600 mb-1">
                    Select Transfer
                  </div>
                  {loadingTransfers ? (
                    <div className="text-center py-1.5">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                    </div>
                  ) : availableTransfers.length > 0 ? (
                    <select
                      value={selectedTransfer?._id || ''}
                      onChange={(e) => {
                        const transfer = availableTransfers.find(
                          (t) => t._id === e.target.value
                        );
                        setSelectedTransfer(transfer || null);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
                    >
                      <option value="">Choose transfer...</option>
                      {availableTransfers.map((transfer) => {
                        const price = calculateTransferPrice(transfer, transferTripType, currency);
                        return (
                          <option key={transfer._id} value={transfer._id}>
                            {transfer.airportCode ? `${transfer.airportCode} - ` : ''}
                            {transfer.airportName.substring(0, 20)}
                            {` - ${formatPrice(price, currency)} ${transferTripType === 'one-way' ? '(One Way)' : '(Round Trip)'}`}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-center py-1.5 bg-gray-50 rounded border border-gray-200">
                      <p className="text-gray-500 text-xs">
                        No transfers available
                      </p>
                    </div>
                  )}
                </div>

                {/* Selected Transfer Details */}
                {selectedTransfer && (
                  <div className="bg-blue-50 rounded p-2 border border-blue-100">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center">
                          <FaPlane className="text-blue-600 mr-1 text-xs" />
                          <div>
                            <div className="font-bold text-gray-800 text-xs truncate">
                              {selectedTransfer.airportName}
                            </div>
                            <div className="text-gray-600 text-[10px] flex items-center gap-1 mt-0.5">
                              <span className="bg-blue-200 text-blue-800 px-1 py-0.5 rounded font-medium">
                                {selectedTransfer.airportCode}
                              </span>
                              <span>•</span>
                              <span>{selectedTransfer.vehicleType}</span>
                              <span>•</span>
                              <span
                                className={`px-1 py-0.5 rounded font-medium ${transferTripType === 'one-way'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                  }`}
                              >
                                {transferTripType === 'one-way'
                                  ? 'One Way'
                                  : 'Round Trip'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-blue-600 text-sm">
                          {formatPrice(getTransferPrice(selectedTransfer), currency)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {transferTripType === 'one-way' ? 'One Way' : 'Round Trip'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800 text-sm">
                Price Summary
              </h3>
              <div className="text-xs text-gray-500">
                {getCurrencyName(currency)}
              </div>
            </div>

            <div className="space-y-2">
              {/* Package Price */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <div className="font-medium text-gray-800 text-sm">
                    Tour Package
                  </div>
                  <div className="text-gray-600 text-xs">
                    {formatPrice(basePricePerPerson, currency)} × {guests}
                  </div>
                </div>
                <div className="font-bold text-gray-900">
                  {formatPrice(packageTotal, currency)}
                </div>
              </div>

              {/* Activities Total */}
              {selectedActivitiesDetails.length > 0 && (
                <div className="flex justify-between items-center py-1 border-t border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      Activities
                    </div>
                    <div className="text-gray-600 text-xs">
                      {selectedActivities.length} activity(s)
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">
                    {formatPrice(activitiesTotal, currency)}
                  </div>
                </div>
              )}

              {/* Transfer Price */}
              {includeTransfer && selectedTransfer && (
                <div className="flex justify-between items-center py-1 border-t border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">
                      Airport Transfer
                    </div>
                    <div className="text-gray-600 text-xs">
                      {selectedTransfer.airportCode} •{' '}
                      {transferTripType === 'one-way'
                        ? 'One Way'
                        : 'Round Trip'}
                    </div>
                    <div className="text-[10px] text-blue-600 mt-0.5">
                      {selectedTransfer.vehicleType}
                    </div>
                  </div>
                  <div className="font-bold text-blue-600">
                    {formatPrice(transferTotal, currency)}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-gray-300 mt-3 pt-3">
              <div className="flex justify-between items-center">
                <div className="font-bold text-gray-900 text-lg">
                  Total Amount
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(totalPrice, currency)}
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-1 text-center">
                <FaCheck className="inline mr-1 text-green-500 text-sm" />
                Complete booking on next page
              </p>
              <p className="text-gray-400 text-xs mt-1 text-center">
                All prices in {getCurrencyName(currency)}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedDate}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span>Continue to Book</span>
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default TourPackageBookingForm;