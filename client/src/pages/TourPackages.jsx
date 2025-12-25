import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TourList from '../components/tourPackages/TourPackageList';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { tourPackagesAPI, airportTransferAPI } from '../utils/api';

const TourPackages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // ============ SIMPLIFIED CURRENCY LOGIC ============
  const queryParams = new URLSearchParams(location.search);
  const urlCurrency = queryParams.get('currency');
  
  // Initialize currency with priority: URL > localStorage > default
  // Always use uppercase ISO codes: 'MUR' or 'EUR'
  const [currency, setCurrency] = useState(() => {
    const storedCurrency = localStorage.getItem('currentCurrency') || 
                         localStorage.getItem('preferredCurrency');
    let initialCurrency = (urlCurrency || storedCurrency || 'MUR').toUpperCase();
    
    // Normalize to valid currency codes
    if (initialCurrency === 'RS' || initialCurrency === 'RUPEE' || initialCurrency === 'RUPEEs') {
      return 'MUR';
    }
    if (initialCurrency === 'EURO' || initialCurrency === '€') {
      return 'EUR';
    }
    return initialCurrency;
  });
  
  const [tourPrices, setTourPrices] = useState({});
  const [availableTransfers, setAvailableTransfers] = useState([]);
  
  // Fetch airport transfers
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await airportTransferAPI.getActive();
        if (response.data.success) {
          setAvailableTransfers(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching airport transfers:', error);
        setAvailableTransfers([]);
      }
    };
    
    fetchTransfers();
  }, []);
  
  // Helper function to calculate transfer price
  const calculateTransferPrice = (transfer, tripType, currency) => {
    if (!transfer) return 0;
    
    if (currency === 'EUR') {
      if (tripType === 'one-way') {
        return transfer.oneWayPriceEUR || transfer.priceEUR || 0;
      } else {
        // Round trip price
        return transfer.roundTripPriceEUR || 
               (transfer.priceEUR ? transfer.priceEUR * 2 : 0) || 
               0;
      }
    } else {
      if (tripType === 'one-way') {
        return transfer.oneWayPriceMUR || 
               transfer.priceMUR || 
               transfer.price || 
               0;
      } else {
        // Round trip price
        return transfer.roundTripPriceMUR || 
               (transfer.priceMUR ? transfer.priceMUR * 2 : 0) || 
               (transfer.price ? transfer.price * 2 : 0) || 
               0;
      }
    }
  };
  
  // Handle currency change - ALWAYS use uppercase ISO codes
  const handleCurrencyChange = (newCurrency) => {
    let normalizedCurrency = newCurrency.toUpperCase();
    
    // Normalize common variations
    if (normalizedCurrency === 'RS' || normalizedCurrency === 'RUPEE') {
      normalizedCurrency = 'MUR';
    }
    if (normalizedCurrency === 'EURO' || normalizedCurrency === '€') {
      normalizedCurrency = 'EUR';
    }
    
    if (normalizedCurrency !== currency) {
      setCurrency(normalizedCurrency);
      
      // Update URL with uppercase ISO code
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('currency', normalizedCurrency);
      navigate({ search: newSearchParams.toString() }, { replace: true });
      
      // Save to localStorage
      localStorage.setItem('currentCurrency', normalizedCurrency);
      localStorage.setItem('preferredCurrency', normalizedCurrency);
    }
  };
  // ============ END SIMPLIFIED CURRENCY LOGIC ============

  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [filters, setFilters] = useState({ priceRange: [0, 100000] });
  const [sortOption, setSortOption] = useState('popularity');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyFilter, setCurrencyFilter] = useState('all'); // 'all', 'MUR', 'EUR'

  const searchQuery = queryParams.get('search');
  const locationParam = queryParams.get('location');
  const typeParam = queryParams.get('type');

  // Helper function to check if a tour is available in a specific currency
  const isTourAvailableInCurrency = (tour, checkCurrency = null) => {
    const check = checkCurrency || currency;
    const supportsCurrency = tour.supportsCurrency || tour.currencyType || 'both';
    
    // Check for Euro availability
    if (check === 'EUR') {
      // Check if tour has Euro price greater than 0
      const hasEuroPrice = (
        tour.priceEUR || 
        tour.priceEur || 
        tour.priceEuro || 
        (tour.prices && tour.prices.EUR) || 
        0
      ) > 0;
      
      // Check if tour supports Euro currency
      const supportsEuroCurrency = (
        supportsCurrency === 'both' || 
        supportsCurrency === 'eur-only' || 
        supportsCurrency === 'euro-only'
      );
      
      // Check if there are airport transfers available in Euro
      const hasEuroTransfers = availableTransfers.length > 0 && 
        availableTransfers.some(transfer => {
          const euroPrice = calculateTransferPrice(transfer, 'one-way', 'EUR');
          return euroPrice > 0;
        });
      
      // Return true if tour supports Euro, has Euro price, or has Euro transfers
      return supportsEuroCurrency || hasEuroPrice || hasEuroTransfers;
    } 
    // Check for MUR/Rupees availability
    else {
      // Check if tour has MUR price greater than 0
      const hasMurPrice = (
        tour.priceMUR || 
        tour.priceRs || 
        tour.price || 
        (tour.prices && tour.prices.MUR) || 
        tour.priceRs || 
        0
      ) > 0;
      
      // Check if tour supports MUR currency
      const supportsMurCurrency = (
        supportsCurrency === 'both' || 
        supportsCurrency === 'rs-only' || 
        supportsCurrency === 'mur-only'
      );
      
      // Check if there are airport transfers available in MUR
      const hasMurTransfers = availableTransfers.length > 0 && 
        availableTransfers.some(transfer => {
          const murPrice = calculateTransferPrice(transfer, 'one-way', 'MUR');
          return murPrice > 0;
        });
      
      // Return true if tour supports MUR, has MUR price, or has MUR transfers
      return supportsMurCurrency || hasMurPrice || hasMurTransfers;
    }
  };

  // Fetch tours with proper currency handling
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = {};
        if (locationParam) params.location = locationParam;
        if (typeParam) params.type = typeParam;

        const response = await tourPackagesAPI.getAll(params);
        const toursData = response?.data?.data || [];

        // IMPORTANT: Map database fields to frontend expected fields
        const validatedTours = toursData.map((tour) => {
          // Use correct field names from TourPackageBookingForm
          const priceMUR = tour.price || 0;
          const priceEUR = tour.priceEur || 0;
          const supportsCurrency = tour.supportsCurrency || 'both';
          
          // Map supportsCurrency to currencyType (using correct values)
          let currencyType = 'rs-only';
          if (supportsCurrency === 'both') {
            currencyType = 'both';
          } else if (supportsCurrency === 'eur-only') {
            currencyType = 'euro-only';
          } else if (supportsCurrency === 'rs-only') {
            currencyType = 'rs-only';
          }

          // Store prices for both currencies like TourPackageBookingForm
          const tourPriceData = {
            MUR: priceMUR,
            EUR: priceEUR
          };
          
          setTourPrices(prev => ({
            ...prev,
            [tour._id]: tourPriceData
          }));

          return {
            ...tour,
            // Map fields for frontend compatibility
            priceRs: priceMUR, // Use priceMUR for priceRs
            priceEuro: priceEUR,
            currencyType: currencyType,
            price: currency === 'EUR' ? priceEUR : priceMUR, // Current price based on selected currency
            // Ensure supportsCurrency is available for display
            supportsCurrency: supportsCurrency,
            // Store both prices like TourPackageBookingForm
            priceMUR: priceMUR,
            priceEUR: priceEUR
          };
        });

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
  }, [location.search, currency]);

  // Helper function to safely get price value with fallbacks
  const getSafePrice = (tour) => {
    if (currency === 'EUR') {
      return tour.priceEUR || tour.priceEur || tour.priceEuro || tour.price || 0;
    } else {
      return tour.priceMUR || tour.priceRs || tour.price || 0;
    }
  };

  // Helper function to format price with 2 decimal places for euro, no decimals for rs
  const formatPrice = (price) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '0';
    
    if (currency === 'EUR') {
      return numericPrice.toFixed(2);
    } else {
      return Math.round(numericPrice).toLocaleString();
    }
  };

  // Helper function to get display price based on user's preferred currency
  const getDisplayPrice = (tour) => {
    if (!tour) {
      return {
        display: '',
        price: 0,
        currency: currency,
        hasAlternative: false,
        currencyType: 'rs-only',
      };
    }

    const currencyType = tour.currencyType || tour.supportsCurrency || 'both';
    const primaryPrice = getSafePrice(tour);
    
    // Determine if alternative price exists
    let hasAlternative = false;
    if (currencyType === 'both') {
      if (currency === 'EUR') {
        hasAlternative = (tour.priceMUR || tour.priceRs || tour.price || 0) > 0;
      } else {
        hasAlternative = (tour.priceEUR || tour.priceEur || tour.priceEuro || 0) > 0;
      }
    }

    // Build display string like TourPackageBookingForm
    let display = '';
    if (currency === 'EUR') {
      display = `€ ${formatPrice(primaryPrice)}`;
    } else {
      display = `Rs ${formatPrice(primaryPrice)}`;
    }

    return {
      display,
      price: primaryPrice,
      currency: currency,
      hasAlternative,
      currencyType,
      primaryDisplay: display,
      secondaryDisplay: null,
    };
  };

  // Get currency badge color - updated to handle supportsCurrency field
  const getCurrencyBadgeColor = (tour) => {
    const currencyType = tour.currencyType || tour.supportsCurrency || 'both';
    
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
      case 'eur-only':
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

  // Get counts for currency filters
  const getCurrencyCounts = () => {
    const allTours = tours.filter(t => 
      isTourAvailableInCurrency(t, 'MUR') || 
      isTourAvailableInCurrency(t, 'EUR')
    ).length;
    
    const rsTours = tours.filter(t => {
      // Check tour price in MUR
      const hasMurPrice = (
        t.priceMUR || 
        t.priceRs || 
        t.price || 
        (t.prices && t.prices.MUR) || 
        0
      ) > 0;
      
      // Check currency support
      const supportsCurrency = t.supportsCurrency || t.currencyType || 'both';
      const supportsRs = (
        supportsCurrency === 'both' || 
        supportsCurrency === 'rs-only' || 
        supportsCurrency === 'mur-only'
      );
      
      // Check for MUR transfers
      const hasMurTransfers = availableTransfers.length > 0 && 
        availableTransfers.some(transfer => {
          const murPrice = calculateTransferPrice(transfer, 'one-way', 'MUR');
          return murPrice > 0;
        });
      
      return hasMurPrice || supportsRs || hasMurTransfers;
    }).length;
    
    const euroTours = tours.filter(t => {
      // Check tour price in EUR
      const hasEuroPrice = (
        t.priceEUR || 
        t.priceEur || 
        t.priceEuro || 
        (t.prices && t.prices.EUR) || 
        0
      ) > 0;
      
      // Check currency support
      const supportsCurrency = t.supportsCurrency || t.currencyType || 'both';
      const supportsEuro = (
        supportsCurrency === 'both' || 
        supportsCurrency === 'eur-only' || 
        supportsCurrency === 'euro-only'
      );
      
      // Check for EUR transfers
      const hasEuroTransfers = availableTransfers.length > 0 && 
        availableTransfers.some(transfer => {
          const euroPrice = calculateTransferPrice(transfer, 'one-way', 'EUR');
          return euroPrice > 0;
        });
      
      return hasEuroPrice || supportsEuro || hasEuroTransfers;
    }).length;

    return {
      all: allTours,
      rs: rsTours,
      euro: euroTours,
    };
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
        // First check if tour is available in the current display currency
        if (!isTourAvailableInCurrency(t)) {
          return false;
        }
        const priceInfo = getDisplayPrice(t);
        const price = priceInfo.price || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Currency filter - only show tours available in selected currency
    if (currencyFilter !== 'all') {
      result = result.filter((t) => {
        return isTourAvailableInCurrency(t, currencyFilter);
      });
    } else {
      // If no currency filter, still show tours available in current display currency
      result = result.filter((t) => {
        return isTourAvailableInCurrency(t);
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
  }, [tours, filters, sortOption, searchQuery, currencyFilter, currency, availableTransfers]);

  const handleFilterChange = (newFilters) =>
    setFilters((prev) => ({ ...prev, ...newFilters }));
  const handleSortChange = (option) => setSortOption(option);
  const handleCurrencyFilterChange = (filterCurrency) => {
    setCurrencyFilter(filterCurrency);
  };

  // Clear search filters
  const handleShowAll = () => {
    // Reset all filters except user currency
    const result = [...tours]
      .filter((t) => isTourAvailableInCurrency(t))
      .sort((a, b) => {
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
    setCurrencyFilter('all');
    setFilters({ priceRange: [0, 100000] });
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
    return currency === 'EUR' ? '€' : 'Rs';
  };

  // Format price for display
  const formatPriceDisplay = (price) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '0';
    
    if (currency === 'EUR') {
      return numericPrice.toFixed(2);
    } else {
      return Math.round(numericPrice).toLocaleString();
    }
  };

  // Get currency display name
  const getCurrencyDisplayName = () => {
    return currency === 'EUR' ? 'EUR (€)' : 'MUR (Rs)';
  };

  const currencyCounts = getCurrencyCounts();

  // Handle currency change for select
  const handleCurrencySelectChange = (selectedCurrency) => {
    handleCurrencyChange(selectedCurrency);
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

            {/* Currency Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h3 className="font-medium text-gray-700 mb-3">
                Filter by Currency
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCurrencyFilterChange('all')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currencyFilter === 'all'
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>All Currencies</span>
                    <span className="text-sm text-gray-500">
                      {currencyCounts.all}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCurrencyFilterChange('MUR')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currencyFilter === 'MUR'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Rupees (Rs) Only</span>
                    <span className="text-sm text-gray-500">
                      {currencyCounts.rs}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCurrencyFilterChange('EUR')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    currencyFilter === 'EUR'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Euros (€) Only</span>
                    <span className="text-sm text-gray-500">
                      {currencyCounts.euro}
                    </span>
                  </div>
                </button>
              </div>
              
              {/* Current Display Currency */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-2">
                  Displaying in: <span className="font-medium">{getCurrencyDisplayName()}</span>
                </p>
                <div className="text-xs text-gray-500">
                  <i className="fas fa-info-circle mr-1"></i>
                  Prices shown in selected currency
                </div>
              </div>
            </div>

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
                      Display Currency:
                    </span>
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        currency === 'MUR'
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
                          currencyFilter === 'MUR'
                            ? 'text-green-600 bg-green-50'
                            : 'text-yellow-600 bg-yellow-50'
                        }`}
                      >
                        <i className="fas fa-money-bill-wave mr-1"></i>
                        {currencyFilter === 'MUR' ? 'Rs Only' : '€ Only'}
                      </span>
                    )}
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        currency === 'MUR'
                          ? 'text-green-600 bg-green-50'
                          : 'text-blue-600 bg-blue-50'
                      }`}
                    >
                      <i className="fas fa-money-bill-wave mr-1"></i>
                      Viewing in {currency === 'MUR' ? 'Rs' : '€'}
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
                      currency === 'MUR' ? 'text-green-600' : 'text-blue-600'
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
                      value={currency}  // Use the actual currency state
                      onChange={(e) => handleCurrencySelectChange(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
                    >
                      <option value="MUR">MUR (Rs)</option>
                      <option value="EUR">EUR (€)</option>
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
                        currencyFilter === 'MUR' ? 'Rupees' : 'Euros'
                      }. Try clearing the currency filter.`
                    : currency === 'EUR'
                    ? 'No tours available in Euros. Try switching to Rupees or clearing the currency filter.'
                    : 'No tour packages available at the moment.'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  <i className="fas fa-money-bill-wave mr-1"></i>
                  Current display currency: {getCurrencyDisplayName()}
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
                  {currency === 'EUR' && (
                    <button
                      onClick={() => handleCurrencyChange('MUR')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                    >
                      Switch to Rupees
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ErrorBoundary>
                <TourList
                  packages={filteredTours}
                  getDisplayPrice={getDisplayPrice}
                  userCurrency={currency}  // Pass uppercase currency
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