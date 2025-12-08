import React from 'react';
import ActivityListItem from './ActivityListItem';

const ActivityList = ({ activities }) => {
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
                    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                        We couldn't find any excursions matching your current filters.
                    </p>
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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Found <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{activities.length}</span> Excursions
                        </h2>
                        <p className="text-gray-600 mt-2">Amazing experiences waiting for you</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">Sorted by:</span>
                            <span className="ml-2 text-blue-600 font-medium">Popularity</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="text-sm text-gray-500">
                            Showing 1-{activities.length} of {activities.length}
                        </div>
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
                        <ActivityListItem activity={activity} />
                    </div>
                ))}
            </div>
            
            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-gray-600">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>All excursions are verified</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
                            <div className="text-sm text-gray-600">Activities</div>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">5★</div>
                            <div className="text-sm text-gray-600">Average Rating</div>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">24/7</div>
                            <div className="text-sm text-gray-600">Support</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Add CSS animation
const style = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
    opacity: 0;
}
`;

export default ActivityList;