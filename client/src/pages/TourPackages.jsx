// pages/TourPackages.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TourFilters from '../components/tourPackages/TourPackageFilters';
import TourSorting from '../components/tourPackages/TourPackageSorting';
import TourList from '../components/tourPackages/TourPackageList';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { tourPackagesAPI } from '../utils/api';

const TourPackages = () => {
    const location = useLocation();
    const [tours, setTours] = useState([]);
    const [filteredTours, setFilteredTours] = useState([]);
    const [filters, setFilters] = useState({ priceRange: [0, 100000] });
    const [sortOption, setSortOption] = useState('popularity');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currencyFilter, setCurrencyFilter] = useState('all'); // 'all', 'rs', 'euro'

    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');
    const locationParam = queryParams.get('location');
    const typeParam = queryParams.get('type');

    // Fetch tours
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
                console.log('Fetched tours:', toursData);

                setTours(toursData);
                setFilteredTours(toursData);
            } catch (err) {
                console.error('Error fetching tours:', err);
                setError(`Failed to load tours: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTours();
    }, [location.search]);

    // Helper function to get display price based on currency type
    const getDisplayPrice = (tour) => {
        switch(tour.currencyType) {
            case 'both':
                return {
                    rs: tour.priceRs,
                    euro: tour.priceEuro,
                    display: `Rs ${tour.priceRs} / € ${tour.priceEuro}`
                };
            case 'rs-only':
                return {
                    rs: tour.priceRs,
                    euro: null,
                    display: `Rs ${tour.priceRs}`
                };
            case 'euro-only':
                return {
                    rs: null,
                    euro: tour.priceEuro,
                    display: `€ ${tour.priceEuro}`
                };
            default:
                return {
                    rs: tour.price,
                    euro: null,
                    display: `Rs ${tour.price}`
                };
        }
    };

    // Filtering & Sorting
    useEffect(() => {
        let result = [...tours];

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => 
                (t?.title || '').toLowerCase().includes(q) ||
                (t?.description || '').toLowerCase().includes(q)
            );
        }

        // Price filter
        if (filters.priceRange) {
            const [minPrice, maxPrice] = filters.priceRange;
            result = result.filter(t => {
                const price = Number(t?.priceRs) || Number(t?.price) || 0;
                return price >= minPrice && price <= maxPrice;
            });
        }

        // Currency filter
        if (currencyFilter !== 'all') {
            result = result.filter(t => {
                if (currencyFilter === 'rs') {
                    return t.currencyType === 'both' || t.currencyType === 'rs-only';
                } else if (currencyFilter === 'euro') {
                    return t.currencyType === 'both' || t.currencyType === 'euro-only';
                }
                return true;
            });
        }

        // Sorting
        result.sort((a, b) => {
            const priceA = Number(a?.priceRs) || Number(a?.price) || 0;
            const priceB = Number(b?.priceRs) || Number(b?.price) || 0;
            
            switch (sortOption) {
                case 'price-asc': return priceA - priceB;
                case 'price-desc': return priceB - priceA;
                case 'popularity':
                default: return (b?.averageRating || 0) - (a?.averageRating || 0);
            }
        });

        setFilteredTours(result);
    }, [tours, filters, sortOption, searchQuery, currencyFilter]);

    const handleFilterChange = (newFilters) => setFilters(prev => ({ ...prev, ...newFilters }));
    const handleSortChange = (option) => setSortOption(option);
    const handleCurrencyFilterChange = (currency) => setCurrencyFilter(currency);

    // Clear search filters
    const handleShowAll = () => {
        const sorted = [...tours].sort((a, b) => {
            const priceA = Number(a?.priceRs) || Number(a?.price) || 0;
            const priceB = Number(b?.priceRs) || Number(b?.price) || 0;
            
            switch (sortOption) {
                case 'price-asc': return priceA - priceB;
                case 'price-desc': return priceB - priceA;
                case 'popularity':
                default: return (b?.averageRating || 0) - (a?.averageRating || 0);
            }
        });
        setFilteredTours(sorted);
        setCurrencyFilter('all');
    };

    // Calculate average price for sidebar
    const getAveragePrice = () => {
        if (filteredTours.length === 0) return 0;
        const total = filteredTours.reduce((sum, tour) => {
            const price = Number(tour?.priceRs) || Number(tour?.price) || 0;
            return sum + price;
        }, 0);
        return Math.round(total / filteredTours.length);
    };

    return (
        <div className="bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-blue-700 font-display">Mauritius Tour Packages</h1>
                            <p className="text-gray-600 mt-2">Discover and book the best tour packages in Mauritius</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleCurrencyFilterChange('all')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        currencyFilter === 'all' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    All Currencies
                                </button>
                                <button
                                    onClick={() => handleCurrencyFilterChange('rs')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        currencyFilter === 'rs' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Rs Only
                                </button>
                                <button
                                    onClick={() => handleCurrencyFilterChange('euro')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        currencyFilter === 'euro' 
                                        ? 'bg-yellow-600 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Euro Only
                                </button>
                            </div>
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
                                <h3 className="font-medium text-gray-700 mb-3">Search Results</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Showing results for: <span className="font-medium">"{searchQuery}"</span>
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
                            <h3 className="font-medium text-gray-700 mb-3">Tour Packages Overview</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Packages:</span>
                                    <span className="font-medium">{tours.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Currently Showing:</span>
                                    <span className="font-medium text-blue-600">{filteredTours.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Average Price:</span>
                                    <span className="font-medium text-green-600">
                                        Rs {getAveragePrice().toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="text-xs text-gray-500 mb-2">Price Range (Rs):</div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Min:</span>
                                        <span className="font-medium">
                                            Rs {filteredTours.length > 0 ? Math.min(...filteredTours.map(t => Number(t?.priceRs) || Number(t?.price) || 0)).toLocaleString() : 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Max:</span>
                                        <span className="font-medium">
                                            Rs {filteredTours.length > 0 ? Math.max(...filteredTours.map(t => Number(t?.priceRs) || Number(t?.price) || 0)).toLocaleString() : 0}
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
                                                <i className="fas fa-tag mr-1"></i> {typeParam.replace('-', ' ')}
                                            </span>
                                        )}
                                        {locationParam && (
                                            <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                                <i className="fas fa-map-marker-alt mr-1"></i> {locationParam}
                                            </span>
                                        )}
                                        {currencyFilter !== 'all' && (
                                            <span className={`text-sm px-3 py-1 rounded-full ${
                                                currencyFilter === 'rs' 
                                                    ? 'text-green-600 bg-green-50' 
                                                    : 'text-yellow-600 bg-yellow-50'
                                            }`}>
                                                <i className="fas fa-money-bill-wave mr-1"></i> 
                                                {currencyFilter === 'rs' ? 'Rs Only' : 'Euro Only'}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-gray-700 mb-3 sm:mb-0 font-medium">
                                    <span className="text-2xl font-bold text-blue-600 mr-1">{filteredTours.length}</span>
                                    tours found {searchQuery && <span>for <span className="italic">"{searchQuery}"</span></span>}
                                    {filteredTours.length !== tours.length && (
                                        <span className="text-sm text-gray-500 ml-2">
                                            (of {tours.length} total)
                                        </span>
                                    )}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <i className="fas fa-money-bill-wave mr-1"></i>
                                    Currency filter: <span className={`font-medium ${
                                        currencyFilter === 'rs' ? 'text-green-600' :
                                        currencyFilter === 'euro' ? 'text-yellow-600' : 'text-blue-600'
                                    }`}>
                                        {currencyFilter === 'all' ? 'All Currencies' :
                                         currencyFilter === 'rs' ? 'Rupees Only' : 'Euro Only'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Tour Listings */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                                <p className="text-blue-600 font-medium animate-pulse">Loading tour packages...</p>
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
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No tours found</h3>
                                <p className="text-gray-500 mb-6">
                                    {searchQuery ? `No results found for "${searchQuery}". Try a different search term.` : 'No tour packages available at the moment.'}
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
                                />
                            </ErrorBoundary>
                        )}
                        
                        {/* Currency Information */}
                        {filteredTours.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start">
                                    <i className="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium mb-1">About Tour Package Prices</p>
                                        
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourPackages;