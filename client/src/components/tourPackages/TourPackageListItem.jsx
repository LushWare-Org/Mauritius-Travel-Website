import React, { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaStar, FaRegStar } from 'react-icons/fa';

const TourPackageListItem = ({ 
  pkg, 
  getDisplayPrice, 
  userCurrency = 'MUR',
  currentCurrency = 'MUR' 
}) => {
    const location = useLocation();
    
    if (!pkg) return null;

    // Get normalized currency from URL and localStorage
    const normalizedCurrency = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        const currency = searchParams.get('currency') || 
                        localStorage.getItem('preferredCurrency') || 
                        'MUR'; // Default to 'MUR'
        
        // Debug log
        console.log('TourPackageListItem - Currency from sources:', { 
            searchParam: searchParams.get('currency'),
            localStorage: localStorage.getItem('preferredCurrency'),
            rawCurrency: currency 
        });
        
        // Normalize ALL cases to 'MUR' or 'EUR'
        const normalized = currency.toString().toUpperCase().trim();
        
        if (normalized === 'EUR' || normalized === 'EURO' || normalized === '€') {
            console.log('TourPackageListItem - Normalized to EUR');
            return 'EUR';
        } else if (normalized === 'RS' || normalized === 'MUR' || normalized === 'RUPEES' || normalized === '₹') {
            console.log('TourPackageListItem - Normalized to MUR');
            return 'MUR';
        } else {
            console.log('TourPackageListItem - Defaulting to MUR');
            return 'MUR';
        }
    }, [location.search]);

    // Use normalizedCurrency as priority, fallback to userCurrency or currentCurrency
    const displayCurrency = useMemo(() => {
        const priorityOrder = [
            normalizedCurrency,
            userCurrency,
            currentCurrency
        ];
        
        const selectedCurrency = priorityOrder.find(curr => 
            curr && (curr.toUpperCase() === 'MUR' || curr.toUpperCase() === 'EUR')
        ) || 'MUR';
        
        // Final normalization
        const normalized = selectedCurrency.toUpperCase().trim();
        return normalized === 'EUR' ? 'EUR' : 'MUR';
    }, [normalizedCurrency, userCurrency, currentCurrency]);

    // Debug logging
    useEffect(() => {
        console.log('TourPackageListItem props:', {
            locationSearch: location.search,
            normalizedCurrency,
            userCurrency,
            currentCurrency,
            displayCurrency,
            pkgId: pkg._id,
            pkgTitle: pkg.title,
            priceMUR: pkg.priceMUR,
            priceEUR: pkg.priceEUR,
            currencyType: pkg.currencyType
        });
    }, [normalizedCurrency, userCurrency, currentCurrency, displayCurrency, pkg, location.search]);

    // Get price information based on display currency
    const priceInfo = useMemo(() => {
        const priceInfoResult = getDisplayPrice ? getDisplayPrice(pkg) : getFallbackDisplayPrice(pkg, displayCurrency);
        console.log('TourPackageListItem - Price info:', priceInfoResult);
        return priceInfoResult;
    }, [pkg, getDisplayPrice, displayCurrency]);

    // Helper function to render stars (same as before)
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(
                    <FaStar 
                        key={i} 
                        className="text-yellow-500" 
                        size={14}
                    />
                );
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(
                    <FaStar 
                        key={i} 
                        className="text-yellow-500" 
                        size={14}
                    />
                );
            } else {
                stars.push(
                    <FaRegStar 
                        key={i} 
                        className="text-gray-300" 
                        size={14}
                    />
                );
            }
        }
        
        return stars;
    };

    // Get currency badge info
    const getCurrencyBadgeInfo = () => {
        if (!pkg.currencyType && !pkg.supportsCurrency) return null;
        
        const currencyType = pkg.currencyType || pkg.supportsCurrency;
        
        switch(currencyType) {
            case 'both':
                return {
                    text: 'Dual Currency',
                    bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
                    borderColor: 'border-green-600',
                    icon: 'fas fa-exchange-alt'
                };
            case 'rs-only':
            case 'mur-only':
                return {
                    text: 'Rs Only',
                    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
                    borderColor: 'border-blue-600',
                    icon: 'fas fa-rupee-sign'
                };
            case 'eur-only':
            case 'euro-only':
                return {
                    text: '€ Only',
                    bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
                    borderColor: 'border-amber-600',
                    icon: 'fas fa-euro-sign'
                };
            default:
                return {
                    text: 'Rs Only',
                    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
                    borderColor: 'border-blue-600',
                    icon: 'fas fa-rupee-sign'
                };
        }
    };

    // Build URL with currency parameter - ALWAYS include currency parameter
    const getTourUrl = useMemo(() => {
        const baseUrl = `/tour-packages/${pkg._id || pkg.id}`;
        
        // Use displayCurrency for URL to ensure consistency
        // This ensures the next page knows what currency to display
        const urlCurrency = displayCurrency;
        
        console.log('TourPackageListItem - Generating URL:', {
            baseUrl,
            urlCurrency,
            priceInfoCurrency: priceInfo?.currency
        });
        
        // Always include currency parameter for consistency
        return `${baseUrl}?currency=${urlCurrency}`;
    }, [pkg._id, pkg.id, displayCurrency, priceInfo?.currency]);

    const currencyBadge = getCurrencyBadgeInfo();

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col sm:flex-row border border-gray-200">
            <div className="sm:w-1/3 h-48 sm:h-auto relative">
                <img 
                    src={pkg.image || '/images/placeholder.jpg'} 
                    alt={pkg.title || 'Tour Package'}
                    className="w-full h-full object-cover"
                />
                
                {/* Featured Badge */}
                {pkg.featured && (
                    <span className="absolute top-3 left-0 bg-yellow-500 text-blue-900 py-1 px-3 font-semibold text-xs uppercase">
                        Featured
                    </span>
                )}
                
                {/* Currency Availability Badge */}
                {currencyBadge && (
                    <span className={`absolute top-3 right-0 py-1 px-3 font-semibold text-xs uppercase text-white ${currencyBadge.bgColor} border ${currencyBadge.borderColor}`}>
                        <i className={`${currencyBadge.icon} mr-1`}></i>
                        {currencyBadge.text}
                    </span>
                )}

                {/* Current Currency Display */}
                <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 backdrop-blur-sm py-1 px-3 rounded-full shadow-sm">
                    <span className={`text-xs font-bold ${
                        displayCurrency === 'EUR' ? 'text-blue-700' : 'text-green-700'
                    }`}>
                        <i className={`fas fa-money-bill-wave mr-1 ${
                            displayCurrency === 'EUR' ? 'text-blue-500' : 'text-green-500'
                        }`}></i>
                        {displayCurrency}
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow sm:w-2/3 relative">
                {/* Title and Rating */}
                <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-blue-700 pr-2">
                        {pkg.title || 'Untitled Package'}
                    </h2>
                    
                    {/* Rating Display */}
                    <div className="flex flex-col items-end">
                        <div className="flex items-center">
                            <div className="flex mr-1">
                                {renderStars(pkg.averageRating || 0)}
                            </div>
                            <span className="font-semibold text-gray-800 text-sm ml-1">
                                {pkg.averageRating ? pkg.averageRating.toFixed(1) : '0.0'}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            ({pkg.totalRatings || 0} reviews)
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                    {pkg.type && pkg.type !== 'Unknown' && pkg.type !== 'unknown' && (
                        <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded capitalize">
                            {pkg.type.replace('-', ' ')}
                        </span>
                    )}
                    
                    {pkg.duration && pkg.duration > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded">
                            {pkg.duration} {pkg.duration === 1 ? 'hr' : 'hrs'}
                        </span>
                    )}
                    
                    {pkg.location && !pkg.location.includes('TBD') && pkg.location !== 'Unknown' && (
                        <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded">
                            {pkg.location}
                        </span>
                    )}
                </div>

                <p className="text-gray-600 my-3 line-clamp-2">
                    {pkg.description || pkg.shortDescription || 'No description available'}
                </p>

                <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-100">
                    <div className="mb-3 sm:mb-0">
                        {/* Main Price Display */}
                        <div className="flex items-center mb-1">
                            <span className="text-blue-800 font-bold text-2xl mr-2">
                                {priceInfo.display}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                displayCurrency === 'EUR' 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                                {displayCurrency}
                            </span>
                        </div>
                        
                        {/* Show alternative price if available */}
                        {priceInfo.hasAlternative && priceInfo.alternativePrice > 0 && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                <i className="fas fa-exchange-alt text-gray-400 mr-1"></i>
                                Also available in {priceInfo.alternativeCurrency === 'EUR' ? '€' : 'Rs'} 
                                <span className="ml-1 font-medium">
                                    {priceInfo.alternativeCurrency === 'EUR' 
                                        ? `€ ${priceInfo.alternativePrice.toFixed(2)}`
                                        : `Rs ${Math.round(priceInfo.alternativePrice)}`
                                    }
                                </span>
                            </div>
                        )}
                        
                        <div className="text-gray-500 text-sm">per package</div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Link 
                            to={getTourUrl}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
                        >
                            <i className="fas fa-eye mr-2"></i>
                            View Details
                        </Link>
                        
                        {/* Display current viewing currency */}
                        <div className="text-xs text-gray-500 text-center">
                            <i className="fas fa-eye mr-1"></i>
                            Viewing in {displayCurrency === 'EUR' ? '€' : 'Rs'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fallback function for when getDisplayPrice is not provided
const getFallbackDisplayPrice = (tour, currency = 'MUR') => {
    console.log('getFallbackDisplayPrice called:', { 
        tourId: tour?._id, 
        requestedCurrency: currency 
    });
    
    if (!tour) return { 
        display: '', 
        price: 0, 
        currency: currency, 
        hasAlternative: false 
    };
    
    // Normalize currency to uppercase for consistency
    const normalizedCurrency = currency.toUpperCase();
    console.log('Normalized currency:', normalizedCurrency);
    
    // Check if tour has currency-specific prices
    const priceMUR = tour.priceMUR || tour.priceRs || tour.price || 0;
    const priceEUR = tour.priceEUR || tour.priceEur || tour.priceEuro || 0;
    const currencyType = tour.currencyType || tour.supportsCurrency || 'rs-only';
    
    console.log('Tour currency data:', { priceMUR, priceEUR, currencyType });
    
    // Determine available currencies based on currencyType
    const isMurAvailable = currencyType === 'both' || 
                          currencyType === 'rs-only' || 
                          currencyType === 'mur-only';
    const isEurAvailable = currencyType === 'both' || 
                          currencyType === 'eur-only' || 
                          currencyType === 'euro-only';
    
    console.log('Availability:', { isMurAvailable, isEurAvailable });
    
    // Select price based on requested currency
    let displayPrice, displayCurrencyCode, alternativeCurrency, alternativePrice;
    
    if (normalizedCurrency === 'EUR' && isEurAvailable && priceEUR > 0) {
        displayPrice = priceEUR;
        displayCurrencyCode = 'EUR';
        if (isMurAvailable && priceMUR > 0) {
            alternativeCurrency = 'MUR';
            alternativePrice = priceMUR;
        }
    } else {
        // Default to MUR
        displayPrice = priceMUR;
        displayCurrencyCode = 'MUR';
        if (isEurAvailable && priceEUR > 0) {
            alternativeCurrency = 'EUR';
            alternativePrice = priceEUR;
        }
    }
    
    console.log('Selected price:', { 
        displayPrice, 
        displayCurrencyCode, 
        alternativeCurrency, 
        alternativePrice 
    });
    
    // Format display string
    let display = '';
    if (displayCurrencyCode === 'EUR') {
        display = `€ ${displayPrice.toFixed(2)}`;
    } else {
        display = `Rs ${Math.round(displayPrice)}`;
    }
    
    const result = {
        display,
        price: displayPrice,
        currency: displayCurrencyCode,
        hasAlternative: !!alternativeCurrency,
        alternativeCurrency,
        alternativePrice
    };
    
    console.log('Result:', result);
    return result;
};

export default TourPackageListItem;