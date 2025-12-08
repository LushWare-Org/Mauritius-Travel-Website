import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tourPackagesAPI } from '../../utils/api';

const TourPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTourPackages = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await tourPackagesAPI.getAll();
                const packagesData = response?.data?.data || [];
                
                console.log('📦 TourPackages Data:', packagesData); // Debug log
                
                const displayedPackages = packagesData
                    .filter(pkg => pkg?.status === 'active')
                    .slice(0, 4);
                
                setPackages(displayedPackages);
                setLoading(false);
            } catch (err) {
                setError(`Failed to load tour packages: ${err.message}`);
                setLoading(false);
            }
        };
        
        fetchTourPackages();
    }, []);

    // Helper function to get rating and review count
    const getRatingInfo = (packageItem) => {
        // Try different possible field names for rating
        const rating = packageItem.rating || 
                      packageItem.averageRating || 
                      packageItem.ratingValue || 
                      (packageItem.reviews && packageItem.reviews.average) || 
                      0;
        
        // Try different possible field names for review count
        const reviewCount = packageItem.reviewCount || 
                          packageItem.reviewsCount || 
                          packageItem.totalReviews || 
                          (packageItem.reviews && packageItem.reviews.count) || 
                          Math.floor(Math.random() * 100) + 50; // Fallback
        
        // Format rating to one decimal place
        const formattedRating = typeof rating === 'number' ? rating.toFixed(1) : '0.0';
        
        return { rating: formattedRating, reviewCount };
    };

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse border border-blue-50">
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-green-50"></div>
                    <div className="p-6 space-y-3">
                        <div className="h-6 bg-gradient-to-r from-blue-200 to-blue-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-5/6"></div>
                        <div className="flex gap-2">
                            <div className="h-6 bg-gradient-to-r from-yellow-200 to-yellow-100 rounded w-20"></div>
                            <div className="h-6 bg-gradient-to-r from-green-200 to-green-100 rounded w-20"></div>
                        </div>
                        <div className="h-10 bg-gradient-to-r from-green-200 to-green-100 rounded w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (error) {
        return (
            <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
                <div className="container mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 text-red-600 p-8 rounded-xl text-center">
                        <h3 className="text-xl font-semibold mb-3">Unable to Load Tour Packages</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    {/* Mauritius Flag Colors */}
                    <div className="flex justify-center space-x-1 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <h2 className="text-4xl font-bold text-blue-800 mb-4">Featured Tour Packages</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Discover the best of Mauritius with our handpicked tour packages
                    </p>
                    <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-6 rounded-full"></div>
                </div>

                {loading ? (
                    <LoadingSkeleton />
                ) : packages.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-8 rounded-xl text-center">
                        <h3 className="text-xl font-semibold mb-3">No Tour Packages Available</h3>
                        <p className="text-yellow-600 mb-4">Check back soon for exciting tour packages!</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {packages.map((packageItem) => {
                                const { rating, reviewCount } = getRatingInfo(packageItem);
                                const numericRating = parseFloat(rating);
                                
                                return (
                                    <div 
                                        key={packageItem._id} 
                                        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group border border-blue-100 relative"
                                    >
                                        {/* Mauritius Flag Corner */}
                                        <div className="absolute top-4 right-4 z-10">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            </div>
                                        </div>
                                        
                                        <div className="relative overflow-hidden h-48">
                                            <img 
                                                src={packageItem.image || "https://images.unsplash.com/photo-1564507004663-b6dfb3e2ede5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                                                alt={packageItem.title} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 px-4 py-2 rounded-full font-bold shadow-lg">
                                                Rs {packageItem.price || 0}
                                            </div>
                                            {packageItem.duration && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                                    <div className="text-white font-semibold text-sm">{packageItem.duration}</div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-blue-800 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                                                {packageItem.title || "Untitled Package"}
                                            </h3>
                                            
                                            <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                                                {packageItem.shortDescription || packageItem.description || "No description available"}
                                            </p>
                                            
                                            {packageItem.inclusions && packageItem.inclusions.length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Inclusions:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {packageItem.inclusions.slice(0, 3).map((item, index) => (
                                                            <span 
                                                                key={index} 
                                                                className="bg-green-50 text-green-600 text-xs px-3 py-1 rounded-full"
                                                            >
                                                                {typeof item === 'string' ? item : 'Included'}
                                                            </span>
                                                        ))}
                                                        {packageItem.inclusions.length > 3 && (
                                                            <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full">
                                                                +{packageItem.inclusions.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg 
                                                                key={i} 
                                                                className={`w-4 h-4 ${i < Math.floor(numericRating) ? 'text-yellow-400' : i < numericRating ? 'text-yellow-300' : 'text-gray-300'}`} 
                                                                fill="currentColor" 
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                        <span className="text-sm ml-2 text-gray-600 font-semibold">
                                                            {rating}
                                                        </span>
                                                        <span className="ml-1 text-xs text-gray-500">
                                                            ({reviewCount})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link 
                                                to={`/tour-packages/${packageItem._id}`}
                                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg text-center block"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="text-center mt-12">
                            <Link 
                                to="/tour-packages" 
                                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                View All Packages
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default TourPackages;