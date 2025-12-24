import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import TourList from '../components/tourPackages/TourPackageList';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { tourPackagesAPI } from '../utils/api';

const TourPackages = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [filters, setFilters] = useState({ priceRange: [0, 100000] });
  const [sortOption, setSortOption] = useState('popularity');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyFilter, setCurrencyFilter] = useState('all'); // 'all', 'rs', 'euro'
  const [userCurrency, setUserCurrency] = useState(() => {
    // Get currency from URL params, localStorage, or default to rs
    return (
      searchParams.get('currency') ||
      localStorage.getItem('preferredCurrency') ||
      'rs'
    );
  });

  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search');
  const locationParam = queryParams.get('location');
  const typeParam = queryParams.get('type');

  // Load user's currency preference from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && (savedCurrency === 'rs' || savedCurrency === 'euro')) {
      setUserCurrency(savedCurrency);
    }
  }, []);

  // Handle currency changes
  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === 'rs' || newCurrency === 'euro') {
      setUserCurrency(newCurrency);
      localStorage.setItem('preferredCurrency', newCurrency);
      // Update URL with currency parameter
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('currency', newCurrency);
      setSearchParams(newSearchParams);
      // Reset currency filter when changing user currency
      setCurrencyFilter('all');
    }
  };

  // Fetch tours
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = {};
        if (locationParam) params.location = locationParam;
        if (typeParam) params.type = typeParam;

        // Add currency parameter to API call if needed
        params.currency = userCurrency;

        const response = await tourPackagesAPI.getAll(params);
        const toursData = response?.data?.data || [];

        // Ensure all tours have required price fields
        const validatedTours = toursData.map((tour) => ({
          ...tour,
          priceRs: tour.priceRs || tour.price || 0,
          priceEuro: tour.priceEuro || tour.price || 0,
          currencyType: tour.currencyType || 'rs-only',
          price: tour.price || tour.priceRs || tour.priceEuro || 0,
        }));

        setTours(validatedTours);
        setFilteredTours(validatedTours);
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError(`Failed to load tours: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, [location.search, userCurrency]);

  // Helper function to safely get price value with fallbacks
  const getSafePrice = (tour, currency) => {
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
      currencyType: tour?.currencyType || 'rs-only',
    };

  const currencyType = tour.currencyType || 'rs-only';
  const primaryPrice = getSafePrice(tour, userCurrency);
  
  // Determine if alternative price exists (for badge/indicator only)
  let hasAlternative = currencyType === 'both';

  // Build display string - ONLY show the selected currency
  let display = '';
  if (userCurrency === 'euro') {
    display = `€ ${formatPrice(primaryPrice, 'euro')}`;
    // REMOVED: Don't show Rs price here
  } else {
    display = `Rs ${formatPrice(primaryPrice, 'rs')}`;
    // REMOVED: Don't show Euro price here
  }

  return {
    display, // This will now only show one currency
    price: primaryPrice,
    currency: userCurrency === 'euro' ? 'EUR' : 'MUR',
    hasAlternative, // Keep this for badges/indicators if needed
    currencyType,
    primaryDisplay: display, // This is now the same as display
    secondaryDisplay: null, // Don't show alternative price in display
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

  // Filtering & Sorting
  useEffect(() => {
    let result = [...tours];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t?.title || '').toLowerCase().includes(q) ||
          (t?.description || '').toLowerCase().includes(q)
      );
    }

    // Price filter - use the appropriate price based on user currency
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      result = result.filter((t) => {
        const priceInfo = getDisplayPrice(t);
        const price = priceInfo.price || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Currency filter - only show tours available in selected currency
    if (currencyFilter !== 'all') {
      result = result.filter((t) => {
        const currencyType = t.currencyType || 'rs-only';
        if (currencyFilter === 'rs') {
          return currencyType === 'both' || currencyType === 'rs-only';
        } else if (currencyFilter === 'euro') {
          return currencyType === 'both' || currencyType === 'euro-only';
        }
        return true;
      });
    }

    // Sorting - sort by price in user's currency
    result.sort((a, b) => {
      const priceInfoA = getDisplayPrice(a);
      const priceInfoB = getDisplayPrice(b);
      const priceA = priceInfoA.price || 0;
      const priceB = priceInfoB.price || 0;

      switch (sortOption) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'popularity':
        default:
          return (b?.averageRating || 0) - (a?.averageRating || 0);
      }
    });

    setFilteredTours(result);
  }, [tours, filters, sortOption, searchQuery, currencyFilter, userCurrency]);

  const handleFilterChange = (newFilters) =>
    setFilters((prev) => ({ ...prev, ...newFilters }));
  const handleSortChange = (option) => setSortOption(option);
  const handleCurrencyFilterChange = (currency) => setCurrencyFilter(currency);

  // Clear search filters
  const handleShowAll = () => {
    const sorted = [...tours].sort((a, b) => {
      const priceInfoA = getDisplayPrice(a);
      const priceInfoB = getDisplayPrice(b);
      const priceA = priceInfoA.price || 0;
      const priceB = priceInfoB.price || 0;

      switch (sortOption) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'popularity':
        default:
          return (b?.averageRating || 0) - (a?.averageRating || 0);
      }
    });
    setFilteredTours(sorted);
    setCurrencyFilter('all');
  };

  
  // Get min and max prices
  const getMinPrice = () => {
    if (filteredTours.length === 0) return 0;
    return Math.min(
      ...filteredTours.map((t) => {
        const priceInfo = getDisplayPrice(t);
        return priceInfo.price || 0;
      })
    );
  };

  const getMaxPrice = () => {
    if (filteredTours.length === 0) return 0;
    return Math.max(
      ...filteredTours.map((t) => {
        const priceInfo = getDisplayPrice(t);
        return priceInfo.price || 0;
      })
    );
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return userCurrency === 'euro' ? '€' : 'Rs';
  };

  // Format price for display
  const formatPriceDisplay = (price) => {
    if (userCurrency === 'euro') {
      return parseFloat(price).toFixed(2);
    } else {
      return Math.round(price).toLocaleString();
    }
  };

  // Get currency display name
  const getCurrencyDisplayName = () => {
    return userCurrency === 'euro' ? 'EUR (€)' : 'MUR (Rs)';
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-700 font-display">
                Mauritius Tour Packages
              </h1>
              <p className="text-gray-600 mt-2">
                Discover and book the best tour packages in Mauritius
              </p>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/4">
            {/* Clear Search Button (only shown when searching) */}
            {searchQuery && (
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  Search Results
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Showing results for:{' '}
                  <span className="font-medium">"{searchQuery}"</span>
                </p>
                <button
                  onClick={handleShowAll}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300"
                >
                  Show All Tour Packages
                </button>
              </div>
            )}

            {/* Tour Packages Info */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium text-gray-700 mb-3">
                Tour Packages Overview
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Packages:</span>
                  <span className="font-medium">{tours.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currently Showing:</span>
                  <span className="font-medium text-blue-600">
                    {filteredTours.length}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">
                    Price Range ({getCurrencySymbol()}):
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Min:</span>
                    <span className="font-medium">
                      {getCurrencySymbol()} {formatPriceDisplay(getMinPrice())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max:</span>
                    <span className="font-medium">
                      {getCurrencySymbol()} {formatPriceDisplay(getMaxPrice())}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Your Currency:
                    </span>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        userCurrency === 'rs'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getCurrencyDisplayName()}
                    </span>
                  </div>
                </div>
                {filteredTours.length < tours.length && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={handleShowAll}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all {tours.length} tour packages
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-3/4">
            {/* Search Tags & Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 rounded-lg shadow transition-all hover:shadow-md">
              <div>
                {searchQuery && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      <i className="fas fa-search mr-1"></i> {searchQuery}
                    </span>
                    {typeParam && (
                      <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        <i className="fas fa-tag mr-1"></i>{' '}
                        {typeParam.replace('-', ' ')}
                      </span>
                    )}
                    {locationParam && (
                      <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        <i className="fas fa-map-marker-alt mr-1"></i>{' '}
                        {locationParam}
                      </span>
                    )}
                    {currencyFilter !== 'all' && (
                      <span
                        className={`text-sm px-3 py-1 rounded-full ${
                          currencyFilter === 'rs'
                            ? 'text-green-600 bg-green-50'
                            : 'text-yellow-600 bg-yellow-50'
                        }`}
                      >
                        <i className="fas fa-money-bill-wave mr-1"></i>
                        {currencyFilter === 'rs' ? 'Rs Only' : '€ Only'}
                      </span>
                    )}
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        userCurrency === 'rs'
                          ? 'text-green-600 bg-green-50'
                          : 'text-blue-600 bg-blue-50'
                      }`}
                    >
                      <i className="fas fa-money-bill-wave mr-1"></i>
                      Viewing in {userCurrency === 'rs' ? 'Rs' : '€'}
                    </span>
                  </div>
                )}
                <p className="text-gray-700 mb-3 sm:mb-0 font-medium">
                  <span className="text-2xl font-bold text-blue-600 mr-1">
                    {filteredTours.length}
                  </span>
                  tours found{' '}
                  {searchQuery && (
                    <span>
                      for <span className="italic">"{searchQuery}"</span>
                    </span>
                  )}
                  {filteredTours.length !== tours.length && (
                    <span className="text-sm text-gray-500 ml-2">
                      (of {tours.length} total)
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <i className="fas fa-money-bill-wave mr-1"></i>
                  All prices shown in:{' '}
                  <span
                    className={`font-medium ${
                      userCurrency === 'rs' ? 'text-green-600' : 'text-blue-600'
                    }`}
                  >
                    {getCurrencyDisplayName()}
                  </span>
                </p>
              </div>

              {/* Currency Selector */}
              <div className="mt-4 md:mt-0">
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Display Currency:
                  </div>
                  <div className="relative">
                    <select
                      value={userCurrency}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                    >
                      <option value="rs">MUR (Rs)</option>
                      <option value="euro">EUR (€)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                      <i className="fas fa-money-bill-wave text-gray-400"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tour Listings */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                <p className="text-blue-600 font-medium animate-pulse">
                  Loading tour packages...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Loading prices in {getCurrencyDisplayName()}...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-md text-center">
                <p className="text-lg font-medium">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredTours.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 text-6xl mb-4">😕</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No tours found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? `No results found for "${searchQuery}". Try a different search term.`
                    : currencyFilter !== 'all'
                    ? `No tours available in ${
                        currencyFilter === 'rs' ? 'Rupees' : 'Euros'
                      }. Try clearing the currency filter.`
                    : 'No tour packages available at the moment.'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  <i className="fas fa-money-bill-wave mr-1"></i>
                  Current currency: {getCurrencyDisplayName()}
                </p>
                <div className="space-x-2">
                  <button
                    onClick={handleShowAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                  >
                    Show All Tours
                  </button>
                  <button
                    onClick={() => setCurrencyFilter('all')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors duration-300"
                  >
                    Clear Currency Filter
                  </button>
                </div>
              </div>
            ) : (
              <ErrorBoundary>
                <TourList
                  packages={filteredTours}
                  getDisplayPrice={getDisplayPrice}
                  userCurrency={userCurrency}
                  getCurrencyBadgeColor={getCurrencyBadgeColor}
                />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourPackages;
