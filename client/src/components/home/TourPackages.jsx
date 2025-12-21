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
                
                const displayedPackages = packagesData
                    .filter(pkg => pkg?.status === 'active')
                    .slice(0, 4);
                
                setPackages(displayedPackages);
                setLoading(false);
            } catch (err) {
                setError(`Unable to load tour packages at this time. Please try again.`);
                setLoading(false);
            }
        };
        
        fetchTourPackages();
    }, []);

    const getRatingInfo = (packageItem) => {
        const rating = packageItem.rating || 
                      packageItem.averageRating || 
                      packageItem.ratingValue || 
                      (packageItem.reviews && packageItem.reviews.average) || 
                      0;
        
        const formattedRating = typeof rating === 'number' ? rating.toFixed(1) : '0.0';
        
        return { rating: formattedRating };
    };

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-blue-100/30 shadow-lg animate-pulse">
                    <div className="h-56 bg-gradient-to-br from-blue-50/50 to-cyan-50/30"></div>
                    <div className="p-6 space-y-4">
                        <div className="h-6 bg-gradient-to-r from-blue-50 to-slate-100 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gradient-to-r from-blue-50 to-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-gradient-to-r from-blue-50 to-slate-100 rounded w-5/6"></div>
                        </div>
                        <div className="h-10 bg-gradient-to-r from-blue-50 to-slate-100 rounded-xl w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const ErrorState = () => (
        <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 mb-6 border border-blue-100/50">
                <svg className="w-10 h-10 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-2xl font-light text-slate-800 mb-3 tracking-tight">
                Connection <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Issue</span>
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
                <span className="flex items-center justify-center">
                    Try Again
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </span>
            </button>
        </div>
    );

    const EmptyState = () => (
        <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-sky-50 mb-6 border border-blue-100/50">
                <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h3 className="text-2xl font-light text-slate-800 mb-3 tracking-tight">
                New <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Packages</span> Coming Soon
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                We're curating exceptional island experiences for you. Check back soon!
            </p>
        </div>
    );

    return (
        <section className="py-24 bg-gradient-to-b from-white via-blue-50/10 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100/50 mb-8 shadow-sm">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 animate-pulse"></div>
                        <span className="text-blue-600 text-sm font-semibold tracking-wider uppercase">
                            Curated Experiences
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-light text-slate-800 mb-6 tracking-tight">
                        Signature <span className="font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Island Tours</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed tracking-wide">
                        Immerse yourself in the tropical beauty of Mauritius with our expertly crafted journeys
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <ErrorState />
                ) : packages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {packages.map((packageItem) => {
                                const { rating } = getRatingInfo(packageItem);
                                const numericRating = parseFloat(rating);
                                
                                return (
                                    <div 
                                        key={packageItem._id} 
                                        className="group relative"
                                    >
                                        {/* Hover Effect Container */}
                                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-teal-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        {/* Card */}
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-blue-100/50 relative h-full flex flex-col group-hover:border-blue-200/70">
                                            {/* Image Container */}
                                            <div className="relative h-56 overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-teal-500/10 z-10"></div>
                                                <img 
                                                    src={packageItem.image || "https://images.unsplash.com/photo-1564507004663-b6dfb3e2ede5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                                                    alt={packageItem.title} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    loading="lazy"
                                                />
                                                
                                                {/* Price Tag */}
                                                <div className="absolute top-4 right-4 z-20">
                                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm bg-white/10">
                                                        <span className="font-bold text-lg tracking-tight">Rs {packageItem.price || 0}</span>
                                                        <span className="text-blue-100 text-xs ml-1 font-medium">/person</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Duration */}
                                                {packageItem.duration && (
                                                    <div className="absolute bottom-4 left-4 z-20">
                                                        <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-slate-800">{packageItem.duration}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="p-6 flex-grow flex flex-col">
                                                {/* 5-Star Rating */}
                                                <div className="flex items-center mb-5">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg 
                                                                key={i} 
                                                                className={`w-5 h-5 ${i < Math.floor(numericRating) ? 'text-yellow-400' : i < numericRating ? 'text-yellow-300' : 'text-slate-300'}`} 
                                                                fill="currentColor" 
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                    <div className="ml-3 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-1.5 rounded-lg">
                                                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                                                            {rating} / 5.0
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Title */}
                                                <h3 className="text-xl font-light text-slate-800 mb-4 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                    {packageItem.title || "Untitled Package"}
                                                    <span className="block w-12 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                                </h3>
                                                
                                                {/* Description */}
                                                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow tracking-wide">
                                                    {packageItem.shortDescription || packageItem.description || "No description available"}
                                                </p>
                                                
                                                {/* Inclusions */}
                                                {packageItem.inclusions && packageItem.inclusions.length > 0 && (
                                                    <div className="mb-6">
                                                        <div className="flex flex-wrap gap-2">
                                                            {packageItem.inclusions.slice(0, 3).map((item, index) => (
                                                                <span 
                                                                    key={index} 
                                                                    className="bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 text-xs px-3.5 py-2 rounded-xl font-medium border border-blue-100/50 hover:border-cyan-200 transition-colors"
                                                                >
                                                                    {typeof item === 'string' ? item : 'Included'}
                                                                </span>
                                                            ))}
                                                            {packageItem.inclusions.length > 3 && (
                                                                <span className="bg-gradient-to-br from-slate-50 to-blue-50 text-slate-600 text-xs px-3.5 py-2 rounded-xl font-medium border border-slate-100">
                                                                    +{packageItem.inclusions.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Action Button */}
                                                <Link 
                                                    to={`/tour-packages/${packageItem._id}`}
                                                    className="mt-auto py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 group/btn text-center shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
                                                >
                                                    <span className="flex items-center justify-center">
                                                        Explore Details
                                                        <svg className="w-4 h-4 ml-3 group-hover/btn:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* View All CTA */}
                        <div className="text-center mt-20 pt-12 border-t border-blue-100/30 relative">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse"></div>
                            </div>
                            <Link 
                                to="/tour-packages" 
                                className="inline-flex items-center px-10 py-4 border-2 border-blue-600 text-blue-600 rounded-2xl font-medium hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 group hover:border-blue-700 hover:text-blue-700 hover:shadow-lg"
                            >
                                Discover All Packages
                                <svg className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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