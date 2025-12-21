import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-blue-50/20 py-16 md:py-24 px-4 overflow-hidden">
            {/* Minimal Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-cyan-100/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-4 w-80 h-80 bg-gradient-to-tr from-green-100/15 to-yellow-100/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header - Enhanced Typography */}
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl mb-8 shadow-lg shadow-blue-200/50">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-800 mb-6 tracking-tight">
                        Holiday Vibes <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">Tour Ltd</span>
                    </h1>
                    <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mb-8 rounded-full"></div>
                    <p className="text-slate-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
                        Where dreams meet the ocean. Your premier gateway to unforgettable island experiences in paradise.
                    </p>
                </div>

                {/* Cards Grid - Improved Structure */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
                    {/* Card 1 - Blue Dominant */}
                    <Link to="/activities" className="group relative bg-white rounded-2xl p-8 shadow-lg border border-blue-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 block">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-start mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                                        <span className="text-lg">🌊</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Island Adventures</h3>
                                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                                        Discover Mauritius' hidden gems through our curated excursions. From underwater wonders to cultural immersions.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-blue-100">
                                <div className="inline-flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
                                    <span>Explore Excursions</span>
                                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 2 - Yellow Accent */}
                    <Link to="/airport-transfers" className="group relative bg-white rounded-2xl p-8 shadow-lg border border-yellow-100 hover:shadow-xl hover:border-yellow-200 transition-all duration-300 block">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/0 to-yellow-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-start mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center shadow-md">
                                        <span className="text-lg">✈️</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Seamless Transfers</h3>
                                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                                        Stress-free airport transportation with meet & greet service. Comfortable vehicles tailored for every group.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-yellow-100">
                                <div className="inline-flex items-center text-yellow-600 font-semibold text-sm group-hover:text-yellow-700 transition-colors">
                                    <span>Book Airport Transfer</span>
                                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Card 3 - Green Accent */}
                    <Link to="/tour-packages" className="group relative bg-white rounded-2xl p-8 shadow-lg border border-green-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 block">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-start mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-white rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center shadow-md">
                                        <span className="text-lg">👨‍👩‍👧‍👦</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Local Expertise</h3>
                                    <p className="text-slate-500 text-sm font-light leading-relaxed">
                                        Authentic experiences curated by island experts. Deep connections with Mauritius' best operators.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-green-100">
                                <div className="inline-flex items-center text-green-600 font-semibold text-sm group-hover:text-green-700 transition-colors">
                                    <span>Visit Tour Packages</span>
                                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Stats Section - Cleaner Design */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative bg-white rounded-2xl p-8 text-center shadow-lg border border-blue-100">
                            <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 mb-4">
                                150+
                            </div>
                            <div className="text-lg font-bold text-slate-800 mb-2">Curated Excursions</div>
                            <p className="text-slate-500 text-sm font-light">From adventure to relaxation</p>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                        </div>
                        
                        <div className="relative bg-white rounded-2xl p-8 text-center shadow-lg border border-yellow-100">
                            <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-yellow-400 mb-4">
                                24/7
                            </div>
                            <div className="text-lg font-bold text-slate-800 mb-2">Airport Service</div>
                            <p className="text-slate-500 text-sm font-light">Always ready for you</p>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full"></div>
                        </div>
                        
                        <div className="relative bg-white rounded-2xl p-8 text-center shadow-lg border border-green-100">
                            <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-500 mb-4">
                                98%
                            </div>
                            <div className="text-lg font-bold text-slate-800 mb-2">Guest Satisfaction</div>
                            <p className="text-slate-500 text-sm font-light">Happy travelers worldwide</p>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* CTA Section - Enhanced Button */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-green-400/20 rounded-2xl"></div>
                    
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-12 text-white overflow-hidden border border-white/10">
                        <div className="text-center">
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-light mb-6">
                                Ready for Your <span className="font-bold text-yellow-300">Paradise Adventure?</span>
                            </h3>
                            <div className="w-20 h-1 bg-gradient-to-r from-yellow-300 to-yellow-200 mx-auto mb-8 rounded-full"></div>
                            <p className="text-lg text-blue-50/90 mb-10 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
                                Join thousands who've discovered the magic of Mauritius with us
                            </p>
                            <Link 
                                to="/activities" 
                                className="group inline-flex items-center bg-gradient-to-r from-yellow-300 to-yellow-400 text-slate-900 font-bold py-4 px-10 rounded-xl hover:shadow-2xl hover:shadow-yellow-200/50 transition-all duration-300 text-base shadow-lg hover:-translate-y-0.5"
                            >
                                <span>Begin Your Journey</span>
                                <svg className="w-5 h-5 ml-3 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <div className="mt-8 flex items-center justify-center text-blue-100/80 text-sm font-light">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                100% Satisfaction Guarantee
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;