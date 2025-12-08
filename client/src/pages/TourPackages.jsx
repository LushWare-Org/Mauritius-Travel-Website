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
                const price = Number(t?.price) || 0;
                return price >= minPrice && price <= maxPrice;
            });
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortOption) {
                case 'price-asc': return (Number(a?.price) || 0) - (Number(b?.price) || 0);
                case 'price-desc': return (Number(b?.price) || 0) - (Number(a?.price) || 0);
                case 'popularity':
                default: return (b?.rating || 0) - (a?.rating || 0);
            }
        });

        setFilteredTours(result);
    }, [tours, filters, sortOption, searchQuery]);

    const handleFilterChange = (newFilters) => setFilters(prev => ({ ...prev, ...newFilters }));
    const handleSortChange = (option) => setSortOption(option);

    return (
        <div className="bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-700 font-display">Mauritius Tour Packages</h1>
                    <p className="text-gray-600 mt-2">Discover and book the best tour packages in Mauritius</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="w-full lg:w-1/4">
                        <TourFilters filters={filters} onFilterChange={handleFilterChange} />
                    </div>

                    {/* Main Content */}
                    <div className="w-full lg:w-3/4">
                        {/* Search Tags & Sorting Bar */}
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
                                    </div>
                                )}
                                <p className="text-gray-700 mb-3 sm:mb-0 font-medium">
                                    <span className="text-2xl font-bold text-blue-600 mr-1">{filteredTours.length}</span>
                                    tours found {searchQuery && <span>for <span className="italic">"{searchQuery}"</span></span>}
                                </p>
                            </div>
                            <TourSorting sortOption={sortOption} onSortChange={handleSortChange} />
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
                        ) : (
                            <ErrorBoundary>
                                <TourList packages={filteredTours} />
                                {/* Add Type / Duration Tags Above Each Tour */}
                                <div className="mt-6">
                                    {filteredTours.map(tour => (
                                        <div key={tour._id || tour.id} className="mb-4">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {tour.type && (
                                                    <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                        <i className="fas fa-tag mr-1"></i> {tour.type.replace('-', ' ')}
                                                    </span>
                                                )}
                                                {tour.duration && (
                                                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                        <i className="fas fa-clock mr-1"></i> {tour.duration} days
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ErrorBoundary>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourPackages;
