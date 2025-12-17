import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ActivityList from '../components/activities/ActivityList';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { activitiesAPI } from '../utils/api';

const Activities = () => {
    const location = useLocation();
    const [allActivities, setAllActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [sortOption, setSortOption] = useState('popularity');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Parse URL search parameters
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');
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
                
                // Apply initial sorting
                filtered = applySorting(filtered, sortOption);
                setFilteredActivities(filtered);
                
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

    // Helper function to apply sorting
    const applySorting = (activities, option) => {
        const sorted = [...activities];
        
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
        
        return sorted;
    };

    // Handle sort changes
    const handleSortChange = (option) => {
        setSortOption(option);
        
        // Apply sorting to filtered activities
        if (filteredActivities.length > 0) {
            const sorted = applySorting(filteredActivities, option);
            setFilteredActivities(sorted);
        }
    };

    // Show all activities (clear search filter)
    const handleShowAll = () => {
        const sorted = applySorting(allActivities, sortOption);
        setFilteredActivities(sorted);
    };

    return (
        <div className="bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-700 font-display">Our Excursions</h1>
                    <p className="text-gray-600 mt-2">Discover and book the best experiences in the Mauritius</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Simplified */}
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
                                    Show All Excursions
                                </button>
                            </div>
                        )}
                        
                        {/* Activity Count Info */}
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="font-medium text-gray-700 mb-3">Excursions Overview</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Excursions:</span>
                                    <span className="font-medium">{allActivities.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Currently Showing:</span>
                                    <span className="font-medium text-blue-600">{filteredActivities.length}</span>
                                </div>
                                {filteredActivities.length < allActivities.length && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <button
                                            onClick={handleShowAll}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            View all {allActivities.length} excursions
                                        </button>
                                    </div>
                                )}
                            </div>
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
                            
                            {/* Sorting Dropdown */}
                            <div className="relative">
                                <select
                                    value={sortOption}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                >
                                    <option value="popularity">Sort by: Popularity</option>
                                    <option value="price-asc">Sort by: Price (Low to High)</option>
                                    <option value="price-desc">Sort by: Price (High to Low)</option>
                                    <option value="duration">Sort by: Duration</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
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
                                    {searchQuery ? `No results found for "${searchQuery}". Try a different search term.` : 'No activities available at the moment.'}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={handleShowAll}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
                                    >
                                        Show All Activities
                                    </button>
                                )}
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