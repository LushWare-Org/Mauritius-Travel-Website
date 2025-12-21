import React from 'react';
import ActivityListItem from './ActivityListItem';

const ActivityList = ({ activities, currency = 'USD' }) => {
    // Get currency symbol
    const getCurrencySymbol = (curr) => {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'MUR': 'Rs'
        };
        return symbols[curr] || '$';
    };

    const symbol = getCurrencySymbol(currency);
    
    // Calculate average price
    const calculateAveragePrice = () => {
        if (!activities || activities.length === 0) return 0;
        const total = activities.reduce((sum, activity) => sum + (activity.price || 0), 0);
        return Math.round(total / activities.length);
    };

    // Handle undefined or null activities
    if (!activities || activities.length === 0) {
        return (
            <div className="relative overflow-hidden">
                {/* Background elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-cyan-50/10"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-100/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-100/20 rounded-full blur-3xl"></div>
                
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-8 shadow-lg">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Excursions Found</h3>
                    <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                        We couldn't find any excursions matching your current filters.
                    </p>
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                        <div className="flex items-center justify-center text-blue-700">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Current currency: {currency} ({symbol})</span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset All Filters
                        </div>
                        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-blue-300 hover:bg-gray-50 transition-all">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Try Different Search
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative">
            
            
            {/* Grid Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        
                       
                    </div>
                    
                </div>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mt-4"></div>
            </div>
            
            {/* Activities Grid */}
            <div className="grid grid-cols-1 gap-6">
                {activities.map((activity, index) => (
                    <div 
                        key={activity._id || activity.id} 
                        className="group animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <ActivityListItem activity={activity} currency={currency} />
                    </div>
                ))}
            </div>
            
            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-gray-600">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>All excursions are verified</span>
                        </div>
                        <div className="flex items-center mt-3 text-sm text-blue-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            <span>Fixed prices in {currency} - no currency conversion fees</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
                            <div className="text-sm text-gray-600">Activities</div>
                            <div className="text-xs text-blue-500 mt-1">in {currency}</div>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {symbol}{calculateAveragePrice()}
                            </div>
                            <div className="text-sm text-gray-600">Avg. Price</div>
                            <div className="text-xs text-green-500 mt-1">per person</div>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">24/7</div>
                            <div className="text-sm text-gray-600">Support</div>
                            <div className="text-xs text-purple-500 mt-1">in {currency}</div>
                        </div>
                    </div>
                </div>
                
                {/* Currency Explanation */}
                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                       
                    </div>
                </div>
            </div>
        </div>
    );
};



export default ActivityList;