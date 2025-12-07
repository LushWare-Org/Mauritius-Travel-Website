import React from 'react';

const About = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 py-20 px-4 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-100/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/10 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 rounded-2xl mb-6 shadow-xl shadow-blue-200/50">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                        Mauritius Paradise
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 mx-auto mb-6 rounded-full shadow-lg"></div>
                    <p className="text-gray-700 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light">
                        Where dreams meet the ocean. Your premier gateway to unforgettable island experiences in paradise.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                    {/* Card 1 - Blue Theme */}
                    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl shadow-blue-100/50 border border-blue-200/50 hover:border-blue-300 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex items-center mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-500 shadow-md shadow-blue-200/50">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">🌊</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Island Adventures</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm mb-6 font-light">
                                Discover Mauritius' hidden gems through our curated excursions. From underwater wonders to cultural immersions.
                            </p>
                            <div className="pt-6 border-t border-blue-100/50">
                                <div className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors text-sm">
                                    <span>Explore Adventures</span>
                                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2 - Yellow Theme */}
                    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl shadow-yellow-100/50 border border-yellow-200/50 hover:border-yellow-300 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-200/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex items-center mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-500 shadow-md shadow-yellow-200/50">
                                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">✈️</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Seamless Transfers</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm mb-6 font-light">
                                Stress-free airport transportation with meet & greet service. Comfortable vehicles tailored for every group.
                            </p>
                            <div className="pt-6 border-t border-yellow-100/50">
                                <div className="inline-flex items-center text-yellow-600 font-semibold group-hover:text-yellow-700 transition-colors text-sm">
                                    <span>Book Transfer</span>
                                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 - Green Theme */}
                    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl shadow-green-100/50 border border-green-200/50 hover:border-green-300 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-200/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="flex items-center mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-500 shadow-md shadow-green-200/50">
                                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">👨‍👩‍👧‍👦</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Local Expertise</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm mb-6 font-light">
                                Authentic experiences curated by island experts. Deep connections with Mauritius' best operators.
                            </p>
                            <div className="pt-6 border-t border-green-100/50">
                                <div className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors text-sm">
                                    <span>Meet Our Team</span>
                                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl shadow-blue-100/50 border border-blue-200/50 hover:border-blue-300 transition-all duration-500 hover:-translate-y-2">
                            <div className="text-5xl font-bold text-blue-600 mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-400">
                                150+
                            </div>
                            <div className="text-xl font-bold text-gray-900 mb-2">Curated Excursions</div>
                            <p className="text-gray-600 font-light text-sm">From adventure to relaxation</p>
                            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto mt-6 rounded-full shadow-md"></div>
                        </div>
                        
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl shadow-yellow-100/50 border border-yellow-200/50 hover:border-yellow-300 transition-all duration-500 hover:-translate-y-2">
                            <div className="text-5xl font-bold text-yellow-500 mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-400">
                                24/7
                            </div>
                            <div className="text-xl font-bold text-gray-900 mb-2">Airport Service</div>
                            <p className="text-gray-600 font-light text-sm">Always ready for you</p>
                            <div className="w-16 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto mt-6 rounded-full shadow-md"></div>
                        </div>
                        
                        <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl shadow-green-100/50 border border-green-200/50 hover:border-green-300 transition-all duration-500 hover:-translate-y-2">
                            <div className="text-5xl font-bold text-green-600 mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
                                98%
                            </div>
                            <div className="text-xl font-bold text-gray-900 mb-2">Guest Satisfaction</div>
                            <p className="text-gray-600 font-light text-sm">Happy travelers worldwide</p>
                            <div className="w-16 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 mx-auto mt-6 rounded-full shadow-md"></div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-500/90 to-cyan-500/90 rounded-3xl shadow-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-green-400/10 rounded-3xl"></div>
                    
                    <div className="relative z-10 bg-gradient-to-r from-blue-500/80 via-blue-400/80 to-cyan-400/80 backdrop-blur-md rounded-3xl p-10 md:p-12 text-white overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-300/20 to-red-300/10 rounded-full -translate-y-32 translate-x-32 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-300/20 to-blue-300/10 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>
                        
                        <div className="relative z-20 text-center">
                            <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                               <span className="text-yellow-300">Ready for Your Paradise Adventure?</span> 
                            </h3>
                            <div className="w-24 h-1 bg-gradient-to-r from-yellow-300 via-yellow-200 to-green-300 mx-auto mb-8 rounded-full shadow-lg"></div>
                            <p className="text-lg md:text-xl mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed font-light">
                                Join thousands who've discovered the magic of Mauritius with us
                            </p>
                            <a 
                                href="/activities" 
                                className="group inline-flex items-center bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 text-gray-900 font-bold py-4 px-10 rounded-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 text-base shadow-xl"
                            >
                                <span>Begin Your Journey</span>
                                <svg className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                            <div className="mt-8 flex items-center justify-center text-yellow-100/80 text-base">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
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