import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar } from 'react-icons/fa';

const TourPackageListItem = ({ pkg }) => {
    if (!pkg) return null;

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

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col sm:flex-row">
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
                    <div>
                        <div className="text-blue-800 font-bold text-xl">Rs {pkg.price || 0}</div>
                        <div className="text-gray-500 text-sm">per person</div>
                    </div>
                    <Link 
                        to={`/tour-packages/${pkg._id || pkg.id}`}
                        className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TourPackageListItem;