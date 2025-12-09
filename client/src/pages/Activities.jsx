import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ActivityFilters from '../components/activities/ActivityFilters';
import ActivitySorting from '../components/activities/ActivitySorting';
import ActivityList from '../components/activities/ActivityList';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { activitiesAPI } from '../utils/api';

const Activities = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [allActivities, setAllActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    
    // IMPORTANT: Use BROAD initial filters to show ALL activities
    const [filters, setFilters] = useState({
        priceRange: [0, 1000],    // Make it wide enough
        duration: [0, 24],        // Make it wide enough
        activityTypes: []         // Empty = show all types
    });
    
    const [sortOption, setSortOption] = useState('popularity');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Parse URL search parameters
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');
    const dateParam = queryParams.get('date');
    const typeParam = queryParams.get('type');
    const locationParam = queryParams.get('location');
    const categoryParam = queryParams.get('category');

    // Fetch activities from the backend API with search params
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                console.log('🔍 Activities Page: Starting to fetch activities...');
                console.log('🌐 API Base URL:', activitiesAPI.baseUrl);
                
                // Build params object from URL query parameters
                const params = {};
                
                // Handle activity type from either type or category param
                const type = typeParam || categoryParam;
                if (type) params.type = type;
                
                // Handle location search
                if (locationParam) params.location = locationParam;
                
                console.log('📋 Activities Page: Request params:', params);
                
                // If there's a search term, we'll filter results client-side
                const response = await activitiesAPI.getAll(params);
                
                console.log('📡 Activities Page: API Response received:', response);
                
                // Set initial data - ensure response data exists and has the expected structure
                const activitiesData = response?.data?.data || [];
                
                console.log('📊 Activities Page: Activities data:', activitiesData);
                console.log('📈 Activities Page: Total activities count:', activitiesData.length);
                
                // Log activity details for debugging
                activitiesData.forEach((activity, index) => {
                    console.log(`${index + 1}. ${activity.title} - $${activity.price} - ${activity.duration}h - Type: ${activity.type || 'N/A'}`);
                });
                
                setAllActivities(activitiesData);
                
                // Calculate ACTUAL ranges from the data and update filters
                if (activitiesData.length > 0) {
                    const prices = activitiesData.map(a => Number(a.price)).filter(p => !isNaN(p));
                    const durations = activitiesData.map(a => Number(a.duration)).filter(d => !isNaN(d));
                    
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    const maxDuration = Math.max(...durations);
                    
                    console.log(`💰 Actual price range: $${minPrice} - $${maxPrice}`);
                    console.log(`⏱️ Actual duration range: 0 - ${maxDuration} hours`);
                    
                    // Find all unique activity types
                    const uniqueTypes = [...new Set(activitiesData.map(a => a.type).filter(Boolean))];
                    console.log('🎯 Unique activity types:', uniqueTypes);
                    
                    // Update filters to match ACTUAL data (not hardcoded values)
                    const updatedFilters = {
                        priceRange: [minPrice, maxPrice],  // Use actual min/max
                        duration: [0, maxDuration],        // Use actual max duration
                        activityTypes: []                  // Show all types initially
                    };
                    
                    // If there's a type param from URL, set it
                    if (type) {
                        updatedFilters.activityTypes = [type];
                    }
                    
                    setFilters(updatedFilters);
                    
                    // Handle client-side filtering for search term
                    let filtered = activitiesData;
                    if (searchQuery) {
                        filtered = activitiesData.filter(activity => 
                            activity?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            activity?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            activity?.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        console.log('🔍 Activities Page: Filtered activities for search:', filtered.length);
                    }
                    
                    setFilteredActivities(filtered);
                } else {
                    setFilteredActivities([]);
                }
                
                console.log('✅ Activities Page: Successfully loaded activities');
            } catch (err) {
                console.error('❌ Activities Page: Error fetching activities:', err);
                console.error('❌ Activities Page: Error details:', {
                    message: err.message,
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data,
                    config: err.config
                });
                setError(`Failed to load activities: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchActivities();
    }, [location.search]);

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        console.log('🎯 New filters:', newFilters);
        console.log('📦 Total activities:', allActivities.length);
        
        // Update the filter state
        setFilters(newFilters);
        
        // Apply filters to ALL activities
        let filtered = [...allActivities];
        
        // Apply search query filter first (if any)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(activity =>
                activity?.title?.toLowerCase().includes(q) ||
                activity?.description?.toLowerCase().includes(q) ||
                activity?.shortDescription?.toLowerCase().includes(q)
            );
        }
        
        // Filter by price
        filtered = filtered.filter(activity => {
            const price = Number(activity.price);
            return price >= newFilters.priceRange[0] && price <= newFilters.priceRange[1];
        });
        
        // Filter by duration
        filtered = filtered.filter(activity => {
            const duration = Number(activity.duration);
            return duration >= newFilters.duration[0] && duration <= newFilters.duration[1];
        });
        
        // Filter by activity type (if any selected)
        if (newFilters.activityTypes && newFilters.activityTypes.length > 0) {
            filtered = filtered.filter(activity => {
                const activityType = activity.type || 'unknown';
                return newFilters.activityTypes.includes(activityType);
            });
        }
        
        // Apply sorting
        switch (sortOption) {
            case 'price-asc':
                filtered.sort((a, b) => (a?.price || 0) - (b?.price || 0));
                break;
            case 'price-desc':
                filtered.sort((a, b) => (b?.price || 0) - (a?.price || 0));
                break;
            case 'duration':
                filtered.sort((a, b) => (a?.duration || 0) - (b?.duration || 0));
                break;
            case 'popularity':
            default:
                filtered.sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
                break;
        }
        
        console.log(`✅ Filtered to: ${filtered.length} activities`);
        setFilteredActivities(filtered);
    };

    // Handle sort changes
    const handleSortChange = (option) => {
        setSortOption(option);
        
        // Re-apply sorting
        if (filteredActivities.length > 0) {
            let sorted = [...filteredActivities];
            
            switch (option) {
                case 'price-asc':
                    sorted.sort((a, b) => (a?.price || 0) - (b?.price || 0));
                    break;
                case 'price-desc':
                    sorted.sort((a, b) => (b?.price || 0) - (a?.price || 0));
                    break;
                case 'duration':
                    sorted.sort((a, b) => (a?.duration || 0) - (b?.duration || 0));
                    break;
                case 'popularity':
                default:
                    sorted.sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
                    break;
            }
            
            setFilteredActivities(sorted);
        }
    };

    // Reset to show ALL activities
    const handleResetFilters = () => {
        console.log('🔄 Resetting to show all activities');
        
        if (allActivities.length > 0) {
            const prices = allActivities.map(a => Number(a.price)).filter(p => !isNaN(p));
            const durations = allActivities.map(a => Number(a.duration)).filter(d => !isNaN(d));
            
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const maxDuration = Math.max(...durations);
            
            const resetFilters = {
                priceRange: [minPrice, maxPrice],
                duration: [0, maxDuration],
                activityTypes: []
            };
            
            setFilters(resetFilters);
            
            // Also re-apply search query if exists
            let filtered = [...allActivities];
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(activity =>
                    activity?.title?.toLowerCase().includes(q) ||
                    activity?.description?.toLowerCase().includes(q) ||
                    activity?.shortDescription?.toLowerCase().includes(q)
                );
            }
            
            setFilteredActivities(filtered);
            
            console.log('✅ Reset filters:', resetFilters);
        }
    };

    return (
        <div className="bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-700 font-display">Mauritius Paradise</h1>
                    <p className="text-gray-600 mt-2">Discover and book the best experiences in the Mauritius</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-1/4">
                        <ActivityFilters 
                            filters={filters} 
                            onFilterChange={handleFilterChange} 
                        />
                        
                        {/* Reset Filters Button */}
                        <div className="mt-6">
                            <button
                                onClick={handleResetFilters}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-300"
                            >
                                Reset All Filters
                            </button>
                        </div>
                        
                        {/* Debug Info - Remove in production */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm border border-gray-200">
                            <h4 className="font-semibold mb-2 text-gray-700">Filter Info:</h4>
                            <p className="text-gray-600">Total: {allActivities.length}</p>
                            <p className="text-gray-600">Showing: {filteredActivities.length}</p>
                            <p className="text-gray-600">Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}</p>
                            <p className="text-gray-600">Duration: {filters.duration[0]} - {filters.duration[1]}h</p>
                            <p className="text-gray-600">
                                Types: {filters.activityTypes.length > 0 ? filters.activityTypes.join(', ') : 'All'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="w-full lg:w-3/4">
                        {/* Search Info and Results Count */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 rounded-lg shadow transition-all hover:shadow-md">
                            <div>
                                {searchQuery && (
                                    <div className="mb-2">
                                        <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full mr-2">
                                            <i className="fas fa-search mr-1"></i> {searchQuery}
                                        </span>
                                        {typeParam && (
                                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full mr-2">
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
                                    <span className="text-2xl font-bold text-blue-600 mr-1">{filteredActivities.length}</span> 
                                    activities found {searchQuery && <span>for <span className="italic">"{searchQuery}"</span></span>}
                                    {filteredActivities.length !== allActivities.length && (
                                        <span className="text-sm text-gray-500 ml-2">
                                            (of {allActivities.length} total)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <ActivitySorting 
                                sortOption={sortOption} 
                                onSortChange={handleSortChange} 
                            />
                        </div>
                        
                        {/* Activity Listings */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                                <p className="text-blue-600 font-medium animate-pulse">Finding perfect excursions for you...</p>
                                {searchQuery && (
                                    <p className="text-gray-500 mt-2">Searching for "{searchQuery}"</p>
                                )}
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
                        ) : filteredActivities.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <div className="text-gray-400 text-6xl mb-4">😕</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No activities found</h3>
                                <p className="text-gray-500 mb-6">
                                    Try adjusting your filters or resetting to see all activities.
                                </p>
                                <button
                                    onClick={handleResetFilters}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <ErrorBoundary>
                                <ActivityList activities={filteredActivities} />
                            </ErrorBoundary>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Activities;