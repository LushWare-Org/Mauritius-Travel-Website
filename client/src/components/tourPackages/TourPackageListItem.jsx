import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar } from 'react-icons/fa';

const TourPackageListItem = ({ pkg, getDisplayPrice, userCurrency }) => {
    if (!pkg) return null;

    // Get price information based on user's selected currency
    const priceInfo = getDisplayPrice ? getDisplayPrice(pkg) : getFallbackDisplayPrice(pkg);

    // Fallback function if getDisplayPrice is not provided
    const getFallbackDisplayPrice = (tour) => {
        if (!tour) return { display: '', price: 0, currency: 'MUR', hasAlternative: false };
        
        if (tour.currencyType && (tour.priceRs !== undefined || tour.priceEuro !== undefined)) {
            // Default to MUR if userCurrency is not provided
            const currency = userCurrency || 'rs';
            
            switch(tour.currencyType) {
                case 'both':
                    if (currency === 'euro' && tour.priceEuro) {
                        return {
                            display: `€ ${tour.priceEuro.toFixed(2)}`,
                            price: tour.priceEuro,
                            currency: 'EUR',
                            hasAlternative: false // Changed to false to hide alternatives
                        };
                    } else {
                        return {
                            display: `Rs ${Math.round(tour.priceRs)}`,
                            price: tour.priceRs,
                            currency: 'MUR',
                            hasAlternative: false // Changed to false to hide alternatives
                        };
                    }
                case 'rs-only':
                    return {
                        display: `Rs ${Math.round(tour.priceRs || tour.price)}`,
                        price: tour.priceRs || tour.price,
                        currency: 'MUR',
                        hasAlternative: false
                    };
                case 'euro-only':
                    return {
                        display: `€ ${(tour.priceEuro || tour.price).toFixed(2)}`,
                        price: tour.priceEuro || tour.price,
                        currency: 'EUR',
                        hasAlternative: false
                    };
                default:
                    return {
                        display: `Rs ${Math.round(tour.price)}`,
                        price: tour.price,
                        currency: 'MUR',
                        hasAlternative: false
                    };
            }
        }
        
        return {
            display: `Rs ${Math.round(tour.price || 0)}`,
            price: tour.price || 0,
            currency: 'MUR',
            hasAlternative: false
        };
    };

    // Helper function to render stars
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

    // Get currency symbol for display
    const getCurrencySymbol = (currencyCode) => {
        return currencyCode === 'EUR' ? '€' : 'Rs';
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col sm:flex-row border border-gray-200">
            <div className="sm:w-1/3 h-48 sm:h-auto relative">
                <img 
                    src={pkg.image || '/images/placeholder.jpg'} 
                    alt={pkg.title || 'Tour Package'}
                    className="w-full h-full object-cover"
                />
                {pkg.featured && (
                    <span className="absolute top-3 left-0 bg-yellow-500 text-blue-900 py-1 px-3 font-semibold text-xs uppercase">
                        Featured
                    </span>
                )}
                
                {/* Currency Availability Badge */}
                {pkg.currencyType && pkg.currencyType !== 'default' && (
                    <span className={`absolute top-3 right-0 py-1 px-3 font-semibold text-xs uppercase ${
                        pkg.currencyType === 'both' 
                            ? 'bg-green-500 text-white border border-green-600'
                            : pkg.currencyType === 'rs-only'
                            ? 'bg-blue-500 text-white border border-blue-600'
                            : 'bg-yellow-500 text-white border border-yellow-600'
                    }`}>
                        {pkg.currencyType === 'both' 
                            ? 'Dual Currency' 
                            : pkg.currencyType === 'rs-only'
                            ? 'Rs Only'
                            : '€ Only'}
                    </span>
                )}

                {/* Current Currency Display */}
                <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 backdrop-blur-sm py-1 px-3 rounded-full shadow-sm">
                    <span className={`text-xs font-bold ${
                        priceInfo.currency === 'EUR' ? 'text-blue-700' : 'text-green-700'
                    }`}>
                        <i className={`fas fa-money-bill-wave mr-1 ${
                            priceInfo.currency === 'EUR' ? 'text-blue-500' : 'text-green-500'
                        }`}></i>
                        {priceInfo.currency} {getCurrencySymbol(priceInfo.currency)}
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow sm:w-2/3 relative">
                {/* Title and Rating in same row */}
                <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-blue-700 pr-2">
                        {pkg.title || 'Untitled Package'}
                    </h2>
                    
                    {/* Rating Display - Top Right Corner */}
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
                    {/* Only show type if it exists and is not "Unknown" */}
                    {pkg.type && pkg.type !== 'Unknown' && pkg.type !== 'unknown' && (
                        <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded capitalize">
                            {pkg.type.replace('-', ' ')}
                        </span>
                    )}
                    
                    {/* Only show duration if it exists and is greater than 0 */}
                    {pkg.duration && pkg.duration > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded">
                            {pkg.duration} {pkg.duration === 1 ? 'hr' : 'hrs'}
                        </span>
                    )}
                    
                    {/* Only show location if it exists and is not "TBD" or "Location TBD" */}
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
                                priceInfo.currency === 'EUR' 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                                {priceInfo.currency}
                            </span>
                        </div>
                        
                     
                        
                        <div className="text-gray-500 text-sm">per package</div>
                        
                        {/* Currency Availability Info - Simplified */}
                        {pkg.currencyType === 'both' && (
                            <div className="text-xs text-green-600 mt-1 flex items-center">
                                <i className="fas fa-exchange-alt mr-1"></i>
                                Available in both currencies
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Link 
                            to={`/tour-packages/${pkg._id || pkg.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm flex items-center justify-center"
                        >
                            <i className="fas fa-eye mr-2"></i>
                            View Details
                        </Link>
                       
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourPackageListItem;