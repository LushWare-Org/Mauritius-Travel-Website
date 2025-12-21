import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { activitiesAPI } from '../../utils/api';
import { Star, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const PopularActivities = () => {
    const carouselRef = useRef(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPopularActivities = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await activitiesAPI.getAll();
                const activitiesData = response?.data?.data || [];
                
                const popularActivities = activitiesData
                    .filter(activity => activity?.status === 'active')
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 6);
                
                setActivities(popularActivities);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching activities:', err);
                setError(`Unable to load excursions at this time.`);
                setLoading(false);
            }
        };
        
        fetchPopularActivities();
    }, []);

    const scrollLeft = () => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * 0.8;
            carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };
    
    const scrollRight = () => {
        if (carouselRef.current) {
            const scrollAmount = carouselRef.current.clientWidth * 0.8;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-blue-100">
                    <div className="h-56 bg-gradient-to-br from-blue-50 to-blue-100"></div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                            <div className="h-4 bg-blue-100 rounded w-1/2"></div>
                        </div>
                        <div className="h-10 bg-blue-100 rounded w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <section className="py-24 bg-gradient-to-b from-white to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="md:flex-1">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-blue-600 text-sm font-medium uppercase tracking-wider">
                                Featured Experiences
                            </span>
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
                            Popular <span className="font-bold text-blue-700">Activities</span>
                        </h2>
                        
                        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                            Discover our most cherished excursions, selected for their exceptional quality and unforgettable experiences
                        </p>
                    </div>
                    
                    <div className="md:self-center">
                        <Link 
                            to="/activities" 
                            className="group relative inline-flex items-center gap-3 px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all duration-300 overflow-hidden active:scale-95"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/100 group-hover:to-blue-100/100 transition-all duration-300"></div>
                            <span className="relative z-10">Explore All</span>
                            <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Connection Issue</h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 cursor-pointer relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                Try Again
                                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Navigation Buttons - Enhanced */}
                        <div className="absolute -top-20 right-4 flex space-x-3 z-10">
                            <button 
                                onClick={scrollLeft}
                                className="group w-14 h-14 rounded-full border-2 border-blue-200 bg-white flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 cursor-pointer relative overflow-hidden"
                                aria-label="Previous activities"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/0 group-hover:from-blue-50/100 group-hover:to-blue-100/100 transition-all duration-300"></div>
                                <ChevronLeft className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                            </button>
                            <button 
                                onClick={scrollRight}
                                className="group w-14 h-14 rounded-full border-2 border-blue-200 bg-white flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 cursor-pointer relative overflow-hidden"
                                aria-label="Next activities"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/0 group-hover:from-blue-50/100 group-hover:to-blue-100/100 transition-all duration-300"></div>
                                <ChevronRight className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* Carousel */}
                        <div 
                            ref={carouselRef}
                            className="flex overflow-x-auto pb-8 gap-8 scroll-smooth cursor-grab active:cursor-grabbing"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {activities.map((activity) => (
                                <div 
                                    key={activity._id}
                                    className="flex-none w-full md:w-[calc(50%-16px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-16px)]"
                                >
                                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-blue-100 h-full flex flex-col hover:shadow-2xl transition-all duration-500 group active:scale-[0.98]">
                                        {/* Image */}
                                        <div className="relative h-64 overflow-hidden">
                                            <img 
                                                src={`${activity.image}?v=1.0.0`}
                                                alt={activity.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                            
                                            {/* Price */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 rounded-full shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                                                    <span className="text-white font-bold text-lg">${activity.price}</span>
                                                    <span className="text-blue-100 text-xs ml-1">/person</span>
                                                </div>
                                            </div>
                                            
                                            {/* Popular Badge */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-blue-700 text-xs font-bold rounded-full border border-blue-100 group-hover:border-blue-200 transition-colors">
                                                    POPULAR
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex-grow flex flex-col">
                                            {/* Rating */}
                                            <div className="flex items-center mb-4">
                                                <div className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 rounded-full group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i}
                                                                className={`w-4 h-4 ${i < Math.floor(activity.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-blue-200 text-blue-200'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium text-blue-700">
                                                        {activity.rating || '0.0'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Title */}
                                            <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
                                                {activity.title}
                                            </h3>
                                            
                                            {/* Duration */}
                                            <div className="flex items-center gap-2 text-gray-600 mb-4">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">4-6 hours</span>
                                            </div>
                                            
                                            {/* Description */}
                                            <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2 flex-grow">
                                                {activity.shortDescription || activity.description}
                                            </p>
                                            
                                            {/* Button */}
                                            <Link
                                                to={`/activities/${activity._id}`}
                                                className="group/btn w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-700/0 to-blue-800/0 group-hover/btn:from-blue-700/100 group-hover/btn:to-blue-800/100 transition-all duration-300"></div>
                                                <span className="relative z-10">Book Experience</span>
                                                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover/btn:translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scroll Indicator */}
                        {activities.length > 4 && (
                            <div className="flex justify-center mt-8">
                                <div className="w-32 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                    <div className="w-1/3 h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full group-hover:w-1/2 transition-all duration-500"></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PopularActivities;