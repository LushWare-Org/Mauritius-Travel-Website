// pages/TourPackageDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TourImageGallery from '../components/tour-detail/TourPackageImageGallery';
import TourInfo from '../components/tour-detail/TourPackageInfo';
import TourTabs from '../components/tour-detail/TourPackageTabs';
import BookingForm from '../components/tour-detail/TourPackageBookingForm';
import {
  FaStar,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaRupeeSign,
  FaEuroSign,
} from 'react-icons/fa';
import { tourPackagesAPI } from '../utils/api';

const TourPackageDetail = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedTours, setRelatedTours] = useState([]);
  const [userCurrency, setUserCurrency] = useState('rs'); // User's preferred currency: 'rs' or 'euro'

  // Load user's currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && (savedCurrency === 'rs' || savedCurrency === 'euro')) {
      setUserCurrency(savedCurrency);
    }
  }, []);

  // Save user's currency preference
  const handleCurrencyChange = (currency) => {
    if (currency === 'rs' || currency === 'euro') {
      setUserCurrency(currency);
      localStorage.setItem('preferredCurrency', currency);
    }
  };

  // Helper function to safely get price value with fallbacks
  const getSafePrice = (tour, currency) => {
    if (!tour) return 0;
    if (currency === 'euro') {
      return tour.priceEuro || tour.price || 0;
    } else {
      return tour.priceRs || tour.price || 0;
    }
  };

  // Helper function to format price with 2 decimal places for euro, no decimals for rs
  const formatPrice = (price, currency) => {
    if (currency === 'euro') {
      return parseFloat(price).toFixed(2);
    } else {
      return Math.round(price).toLocaleString();
    }
  };

  // Helper function to get display price based on user's preferred currency
  const getDisplayPrice = (tour) => {
    if (!tour)
      return {
        display: '',
        price: 0,
        currency: userCurrency === 'euro' ? 'EUR' : 'MUR',
        hasAlternative: false,
        alternativePrice: null,
        currencyType: tour?.currencyType || 'rs-only',
      };

    const currencyType = tour.currencyType || 'rs-only';

    // Get the primary price based on user's preference
    const primaryPrice = getSafePrice(tour, userCurrency);
    const primaryCurrency = userCurrency === 'euro' ? 'EUR' : 'MUR';

    // Determine if alternative price exists
    let alternativePrice = null;
    let hasAlternative = false;

    if (currencyType === 'both') {
      hasAlternative = true;
      const alternativeCurrency = userCurrency === 'euro' ? 'rs' : 'euro';
      const altPrice = getSafePrice(tour, alternativeCurrency);
      alternativePrice =
        alternativeCurrency === 'euro'
          ? `€ ${formatPrice(altPrice, 'euro')}`
          : `Rs ${formatPrice(altPrice, 'rs')}`;
    }

    // Build display string
    let display = '';
    if (userCurrency === 'euro') {
      display = `€ ${formatPrice(primaryPrice, 'euro')}`;
      if (hasAlternative) {
        display += ` / Rs ${formatPrice(getSafePrice(tour, 'rs'), 'rs')}`;
      }
    } else {
      display = `Rs ${formatPrice(primaryPrice, 'rs')}`;
      if (hasAlternative) {
        display += ` / € ${formatPrice(getSafePrice(tour, 'euro'), 'euro')}`;
      }
    }

    return {
      display,
      price: primaryPrice,
      currency: primaryCurrency,
      hasAlternative,
      alternativePrice,
      currencyType,
      primaryDisplay:
        userCurrency === 'euro'
          ? `€ ${formatPrice(primaryPrice, 'euro')}`
          : `Rs ${formatPrice(primaryPrice, 'rs')}`,
      secondaryDisplay: hasAlternative ? alternativePrice : null,
    };
  };

  // Get currency badge color
  const getCurrencyBadgeColor = (currencyType) => {
    switch (currencyType) {
      case 'both':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-300',
          label: 'Rs & Euro Available',
        };
      case 'rs-only':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-300',
          label: 'Rs Only',
        };
      case 'euro-only':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-300',
          label: 'Euro Only',
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-300',
          label: 'Rs Only',
        };
    }
  };

  useEffect(() => {
    const fetchTour = async () => {
      setLoading(true);
      try {
        // Fetch the tour package by ID
        const tourResponse = await tourPackagesAPI.getById(id);
        const foundTour = tourResponse?.data?.data;

        if (foundTour) {
          // Ensure tour has required price fields
          const validatedTour = {
            ...foundTour,
            priceRs: foundTour.priceRs || foundTour.price || 0,
            priceEuro: foundTour.priceEuro || foundTour.price || 0,
            currencyType: foundTour.currencyType || 'rs-only',
            price:
              foundTour.price || foundTour.priceRs || foundTour.priceEuro || 0,
          };

          setTour(validatedTour);

          // Fetch all tours to determine related packages
          const allToursResponse = await tourPackagesAPI.getAll();
          const allToursData = allToursResponse?.data?.data || [];

          // Validate all tours
          const allTours = allToursData.map((t) => ({
            ...t,
            priceRs: t.priceRs || t.price || 0,
            priceEuro: t.priceEuro || t.price || 0,
            currencyType: t.currencyType || 'rs-only',
            price: t.price || t.priceRs || t.priceEuro || 0,
          }));

          const related = allTours
            .filter(
              (t) =>
                t._id !== validatedTour._id &&
                (t.type === validatedTour.type ||
                  t.location === validatedTour.location)
            )
            .slice(0, 4); // Limit to 4 related tours

          setRelatedTours(related);
        }
      } catch (error) {
        console.error('Error fetching tour details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTour();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">Tour Not Found</h2>
          <p>Sorry, we couldn't find the tour package you're looking for.</p>
        </div>
      </div>
    );
  }

  const priceDisplay = getDisplayPrice(tour);
  const currencyBadge = getCurrencyBadgeColor(tour.currencyType);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Image Gallery */}
      <TourImageGallery pkg={tour} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Compact Tour Header with Price Selection */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-100">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="lg:w-2/3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {tour.title}
                  </h1>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {tour.shortDescription}
                  </p>
                </div>

                {/* Compact Rating & Info Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <div className="flex mr-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          size={16}
                          className={
                            i < Math.floor(tour.averageRating)
                              ? 'text-yellow-500'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <span className="font-semibold">
                      {tour.averageRating.toFixed(1)}
                    </span>
                    <span className="ml-1 text-gray-600 text-sm">
                      ({tour.totalRatings})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    {tour.duration && (
                      <span className="flex items-center">
                        <FaCalendarAlt className="mr-1" size={14} />
                        {tour.duration}
                      </span>
                    )}
                    {tour.maxParticipants && (
                      <span className="flex items-center">
                        <FaUsers className="mr-1" size={14} />
                        {tour.maxParticipants}
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Highlights */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {tour.highlights?.slice(0, 4).map((highlight, index) => (
                    <div
                      key={index}
                      className="flex items-start text-sm text-gray-700"
                    >
                      <FaCheckCircle
                        className="text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        size={14}
                      />
                      <span className="line-clamp-1">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              
            </div>
          </div>
        </div>

        {/* Main Content Area - Full width layout */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Left Column - Details Tabs */}
          <div className="xl:w-6/12">
            {/* Details Tabs */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <TourTabs pkg={tour} />
            </div>
          </div>

          {/* Right Column - Booking Form (Wider) */}
          <div className="xl:w-6/12">
            {/* Booking Form - Now takes full width of the right column */}
            <div>
              <BookingForm
                tour={tour}
                userCurrency={userCurrency}
                priceDisplay={priceDisplay}
              />
            </div>
          </div>
        </div>

        {/* Related Tours */}
        {relatedTours.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  You might also like
                </h2>
                <p className="text-gray-600">Similar tours you might enjoy</p>
              </div>
              <Link
                to="/tour-packages"
                className="text-blue-600 font-semibold hover:text-blue-800 flex items-center"
              >
                View all tours
                <svg
                  className="ml-1 w-4 h-4"
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
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedTours.map((relatedTour) => {
                const relatedPriceDisplay = getDisplayPrice(relatedTour);
                const relatedCurrencyBadge = getCurrencyBadgeColor(
                  relatedTour.currencyType
                );

                return (
                  <Link
                    key={relatedTour._id}
                    to={`/tour-packages/${relatedTour._id}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
                  >
                    <div className="relative">
                      <img
                        src={relatedTour.image}
                        alt={relatedTour.title}
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                        <span className="text-sm font-bold text-green-600">
                          {relatedPriceDisplay.primaryDisplay}
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${relatedCurrencyBadge.bg} ${relatedCurrencyBadge.text}`}
                        >
                          {relatedTour.currencyType === 'both'
                            ? 'Rs/€'
                            : relatedTour.currencyType === 'rs-only'
                            ? 'Rs'
                            : '€'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 h-14">
                        {relatedTour.title}
                      </h3>
                      <div className="flex items-center mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, index) => (
                            <FaStar
                              key={index}
                              size={14}
                              className={
                                index < Math.floor(relatedTour.averageRating)
                                  ? 'text-yellow-500'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {relatedTour.averageRating.toFixed(1)} (
                          {relatedTour.totalRatings})
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-gray-600 text-sm">
                          {relatedTour.duration || '1 day'}
                        </span>
                        <span className="text-blue-600 font-semibold text-sm">
                          {userCurrency === 'rs' ? 'Rs ' : '€ '}
                          {relatedPriceDisplay.price.toLocaleString()}
                          {userCurrency === 'euro' ? '.00' : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourPackageDetail;
