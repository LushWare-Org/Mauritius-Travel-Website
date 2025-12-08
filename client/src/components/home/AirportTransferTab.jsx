import React from 'react';
import { Link } from 'react-router-dom';

const AirportTransferTab = () => {
    return (
        <section className="py-12 bg-gradient-to-r from-white via-blue-50 to-white">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-200 transform hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                        {/* Mauritius Flag Background Pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-400 rounded-full"></div>
                            <div className="absolute inset-8 bg-gradient-to-br from-blue-400 to-blue-300 rounded-full"></div>
                            <div className="absolute inset-16 bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-full"></div>
                            <div className="absolute inset-24 bg-gradient-to-br from-green-500 to-green-400 rounded-full"></div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center mb-4">
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-full mr-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-blue-800">Airport Transfers</h2>
                                        <p className="text-gray-600 mt-1">Seamless transportation to and from Sir Seewoosagur Ramgoolam Airport</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="flex items-center space-x-3 bg-green-50 p-3 rounded-lg">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 font-medium">24/7 Service</span>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 font-medium">Multiple Vehicle Options</span>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-yellow-50 p-3 rounded-lg">
                                        <div className="bg-yellow-100 p-2 rounded-full">
                                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 font-medium">Best Price Guarantee</span>
                                    </div>
                                </div>
                            </div>
                            
                            <Link 
                                to="/airport-transfers"
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                            >
                                <span>Book Transfer</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center text-sm text-gray-500">
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Pre-book your airport transfer and save up to 20% compared to on-site booking</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AirportTransferTab;