import React from 'react';
import { Link } from 'react-router-dom';

const RelatedActivities = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Header with gradient line */}
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">More Adventures</span>
                </h2>
                <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                <p className="text-gray-600 mt-3">Explore these amazing experiences you might enjoy</p>
            </div>
            
            {/* Activities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {activities.map(activity => (
                    <Link 
                        to={`/activities/${activity._id}`} 
                        key={activity._id}
                        className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
                    >
                        {/* Image Container */}
                        <div className="relative h-56 overflow-hidden">
                            <img 
                                src={activity.image} 
                                alt={activity.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                loading="lazy"
                            />
                            {/* Price Badge */}
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                                ${activity.price}
                            </div>
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-5">
                            {/* Title */}
                            <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {activity.title}
                            </h3>
                            
                            {/* Rating */}
                            <div className="flex items-center mb-4">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <svg 
                                            key={i}
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className={`h-4 w-4 ${i < Math.floor(activity.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                            viewBox="0 0 20 20" 
                                            fill="currentColor"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="ml-2 font-medium text-gray-900">{activity.rating}</span>
                                <span className="ml-1 text-sm text-gray-500">({activity.reviewCount})</span>
                            </div>
                            
                            {/* Description */}
                            <p className="text-gray-600 text-sm line-clamp-2 mb-6 leading-relaxed">
                                {activity.description}
                            </p>
                            
                            {/* CTA Button */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                                    View Details
                                </span>
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-cyan-200 transition-all">
                                    <svg className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Hover Indicator */}
                        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 group-hover:w-full transition-all duration-500"></div>
                    </Link>
                ))}
            </div>

            {/* Bottom View All Link */}
            <div className="text-center mt-12">
                <Link 
                    to="/activities" 
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                    <span>View All Activities</span>
                    <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default RelatedActivities;