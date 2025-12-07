import React, { useState } from 'react';

const ActivityTabs = ({ activity }) => {
    const [activeTab, setActiveTab] = useState('description');
    
    const tabs = [
        { id: 'description', label: 'Description', icon: '📝' },
        { id: 'inclusions', label: 'What\'s Included', icon: '✅' },
        { id: 'exclusions', label: 'What\'s Not Included', icon: '❌' },
        { id: 'requirements', label: 'Requirements', icon: '📋' },
        { id: 'location', label: 'Location', icon: '📍' }
    ];

    const inclusions = activity.included && activity.included.length > 0 ? 
        activity.included : 
        [
            "Professional English-speaking guide",
            "Hotel pickup and drop-off",
            "All equipment needed for the activity",
            "Safety briefing",
            "Refreshments",
            "Insurance coverage"
        ];
    
    const exclusions = activity.notIncluded && activity.notIncluded.length > 0 ? 
        activity.notIncluded : 
        [
            "Personal expenses",
            "Gratuities (optional)",
            "Meals not specified",
            "Alcoholic beverages",
            "Additional activities not mentioned",
            "Souvenirs and personal shopping"
        ];
    
    const requirements = activity.requirements && activity.requirements.length > 0 ? 
        activity.requirements : 
        [
            "Good physical condition",
            "Swimwear and towel",
            "Sunscreen and sunglasses",
            "Comfortable clothing",
            "Valid ID/passport",
            "Minimum age: 12 years"
        ];

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Tabs Navigation */}
            <div className="flex flex-wrap border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 group ${
                            activeTab === tab.id 
                                ? 'text-blue-700 bg-white shadow-sm border-t border-x border-gray-200 rounded-t-lg' 
                                : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                        }`}
                    >
                        <span className="mr-3 text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                        )}
                        <div className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full ${
                            activeTab === tab.id ? 'w-full' : ''
                        }`}></div>
                    </button>
                ))}
            </div>
            
            {/* Tab Content */}
            <div className="p-8">
                {/* Description Tab */}
                {activeTab === 'description' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-xl">📝</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Activity Details</h3>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                            <p className="text-gray-700 text-lg leading-relaxed mb-4">
                                {activity.description}
                            </p>
                            <p className="text-gray-700 text-lg leading-relaxed">
                                This {activity.duration}-hour {activity.type.replace('-', ' ')} experience is designed to immerse you in the natural beauty of Mauritius. 
                                Our expert guides will ensure every moment is filled with wonder and excitement.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                                <div className="flex items-center mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Duration</p>
                                        <p className="font-semibold text-gray-900">{activity.duration} hours</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-100">
                                <div className="flex items-center mb-3">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="font-semibold text-gray-900">{activity.location}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100">
                                <div className="flex items-center mb-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Group Size</p>
                                        <p className="font-semibold text-gray-900">Small groups</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Inclusions Tab */}
                {activeTab === 'inclusions' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-xl">✅</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">What's Included</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {inclusions.map((item, index) => (
                                <div key={index} className="group bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-100 hover:border-green-300 transition-all duration-300">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-800 group-hover:text-green-700 transition-colors">{item}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Value Added</h4>
                            <p className="text-gray-700">
                                Everything you need for a seamless and enjoyable experience is included. 
                                Our goal is to provide worry-free adventures where you can focus on creating memories.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Exclusions Tab */}
                {activeTab === 'exclusions' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-xl">❌</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">What's Not Included</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {exclusions.map((item, index) => (
                                <div key={index} className="group bg-gradient-to-br from-red-50 to-white rounded-xl p-5 border border-red-100 hover:border-red-300 transition-all duration-300">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-800 group-hover:text-red-700 transition-colors">{item}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Pro Tips</h4>
                            <p className="text-gray-700">
                                We recommend bringing some cash for personal purchases and gratuities. 
                                Our guides appreciate tips but they are completely optional based on your satisfaction.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Requirements Tab */}
                {activeTab === 'requirements' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-xl">📋</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Requirements & Preparation</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {requirements.map((item, index) => (
                                <div key={index} className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 hover:border-blue-300 transition-all duration-300">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-800 group-hover:text-blue-700 transition-colors">{item}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Health & Safety</h4>
                            <p className="text-gray-700">
                                All participants must complete a health declaration form. 
                                Please inform us of any medical conditions or concerns in advance for your safety.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Location Tab */}
                {activeTab === 'location' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center mr-4">
                                <span className="text-xl">📍</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Location & Meeting Point</h3>
                        </div>
                        
                        {/* Map Placeholder */}
                        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-80 overflow-hidden border border-blue-200 shadow-inner">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{activity.location}</h4>
                                    <p className="text-gray-600">Beautiful beaches and crystal clear waters await</p>
                                </div>
                            </div>
                            
                            {/* Map Marker */}
                            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-xl animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                </div>
                            </div>
                            
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium text-gray-900">Activity Location</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                                <h4 className="font-semibold text-gray-900 mb-3">Meeting Instructions</h4>
                                <p className="text-gray-700 mb-4">
                                    You'll meet our guide at the main lobby of your resort or a designated pickup point. 
                                    Exact meeting instructions will be provided 24 hours before your activity.
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li className="flex items-center">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Pickup 30 minutes before start time
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Look for our logo on the vehicle
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                                <h4 className="font-semibold text-gray-900 mb-3">Transportation</h4>
                                <p className="text-gray-700 mb-4">
                                    Comfortable air-conditioned transportation is included for all participants from designated pickup points.
                                </p>
                                <div className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Free cancellation up to 24 hours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add this CSS animation
const style = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
}
`;

export default ActivityTabs;