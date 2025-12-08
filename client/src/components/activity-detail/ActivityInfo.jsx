import React, { useState, useEffect } from 'react';

const ActivityInfo = ({ activity }) => {
    const [selectedDuration, setSelectedDuration] = useState('halfDay');
    
    // Determine current price based on selection
    const getCurrentPrice = () => {
        if (activity.pricingType === 'half-full-day') {
            return selectedDuration === 'halfDay' 
                ? (activity.halfDayPrice || activity.price)
                : (activity.fullDayPrice || activity.price);
        }
        return activity.price;
    };
    
    const getCurrentDuration = () => {
        if (activity.pricingType === 'half-full-day') {
            return selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day';
        }
        return activity.duration;
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-blue-800 mb-2 font-display">{activity.title}</h1>
                    <div className="flex items-center mb-2">
                        <div className="flex items-center mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="ml-1 text-lg font-medium">{activity.rating}</span>
                            <span className="ml-1 text-gray-600">({activity.reviewCount} reviews)</span>
                        </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{activity.location}</span>
                    </div>
                </div>
                
                <div className="mt-4 md:mt-0 bg-blue-50 p-4 rounded-lg">
                    {/* Duration Selection for Half/Full Day */}
                    {activity.pricingType === 'half-full-day' ? (
                        <div className="mb-3">
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                        selectedDuration === 'halfDay'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                                    }`}
                                    onClick={() => setSelectedDuration('halfDay')}
                                >
                                    Half Day
                                    <div className="text-xs mt-1">
                                        ${activity.halfDayPrice || activity.price}
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                        selectedDuration === 'fullDay'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                                    }`}
                                    onClick={() => setSelectedDuration('fullDay')}
                                >
                                    Full Day
                                    <div className="text-xs mt-1">
                                        ${activity.fullDayPrice || activity.price}
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : null}
                    
                    <div className="text-gray-700 mb-2">
                        <span className="font-medium">Price:</span> 
                        <span className="ml-1 text-blue-700 font-bold">${getCurrentPrice()} per package</span>
                    </div>
                    <div className="text-gray-700 mb-2">
                        <span className="font-medium">Duration:</span> 
                        <span className="ml-1">
                            {activity.pricingType === 'half-full-day' 
                                ? getCurrentDuration() 
                                : `${activity.duration} hour${activity.duration !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                    <div className="text-gray-700">
                        <span className="font-medium">Type:</span> {activity.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityInfo;