import React from 'react';

const About = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 py-12 px-4">
            {/* Header Section with Gradient */}
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-block p-1 bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-full mb-6">
                        <div className="bg-white rounded-full p-3">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-green-600 to-red-600 bg-clip-text text-transparent">
                        About Mauritius Paradise
                    </h1>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-yellow-400 to-red-500 mx-auto rounded-full"></div>
                </div>

                {/* Content Cards */}
                <div className="space-y-8">
                    {/* Card 1 */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-start mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mr-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Your Gateway to Paradise</h2>
                        </div>
                        <p className="text-gray-700 text-lg leading-relaxed pl-14">
                            Welcome to <span className="font-semibold text-blue-600">Mauritius Paradise</span>, your premier destination for unforgettable experiences in the heart of the Indian Ocean. We specialize in curating exceptional excursions, seamless airport transfers, and comprehensive tour packages that showcase the breathtaking beauty and rich culture of Mauritius.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl p-8 transform hover:-translate-y-1 transition-transform duration-300 border-l-4 border-yellow-500">
                        <div className="flex items-start mb-4">
                            <div className="p-3 bg-gradient-to-br from-green-100 to-yellow-100 rounded-xl mr-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Comprehensive Travel Solutions</h2>
                        </div>
                        <p className="text-gray-700 text-lg leading-relaxed pl-14">
                            From the moment you land at Sir Seewoosagur Ramgoolam International Airport, we've got you covered with our reliable <span className="font-semibold text-green-600">airport transfer services</span>. Explore our wide range of excursions including snorkeling in Blue Bay Marine Park, hiking in Black River Gorges National Park, and cultural tours of Port Louis. Our carefully designed tour packages combine luxury accommodation with authentic Mauritian experiences.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-start mb-4">
                            <div className="p-3 bg-gradient-to-br from-red-100 to-yellow-100 rounded-xl mr-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Local Expertise & Quality Service</h2>
                        </div>
                        <p className="text-gray-700 text-lg leading-relaxed pl-14">
                            With deep roots in Mauritius, we partner with the island's best hotels and local operators to ensure <span className="font-semibold text-red-600">authentic and high-quality experiences</span>. Our knowledgeable guides, comfortable transportation, and hand-picked hotel partnerships make your Mauritian holiday seamless and memorable. We're passionate about sharing our island's treasures with you.
                        </p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl text-center transform hover:scale-105 transition-transform duration-300">
                        <div className="text-4xl font-bold mb-2">150+</div>
                        <div className="text-blue-100">Curated Excursions</div>
                        <p className="text-blue-200 text-sm mt-2">From underwater sea walks to Seven Colored Earth tours</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl text-center transform hover:scale-105 transition-transform duration-300">
                        <div className="text-4xl font-bold mb-2">24/7</div>
                        <div className="text-green-100">Airport Transfers</div>
                        <p className="text-green-200 text-sm mt-2">Reliable transfers to all major hotels and resorts</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-500 to-yellow-500 text-white p-6 rounded-2xl text-center transform hover:scale-105 transition-transform duration-300">
                        <div className="text-4xl font-bold mb-2">50+</div>
                        <div className="text-red-100">Hotel Partners</div>
                        <p className="text-red-200 text-sm mt-2">Luxury resorts to charming beachfront villas</p>
                    </div>
                </div>

                {/* Services Highlights */}
                <div className="mt-16 bg-gradient-to-r from-yellow-50 to-red-50 rounded-2xl p-8">
                    <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">Our Core Services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-green-500 rounded-full mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Tour Packages</h4>
                            <p className="text-gray-600">All-inclusive holidays combining luxury stays with exclusive experiences</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="inline-block p-4 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Airport Transfers</h4>
                            <p className="text-gray-600">Comfortable, timely transfers with meet & greet service</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="inline-block p-4 bg-gradient-to-br from-red-500 to-blue-500 rounded-full mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                </svg>
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">Excursions</h4>
                            <p className="text-gray-600">Adventure, culture, nature, and relaxation experiences</p>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 text-center">
                    <div className="inline-block p-0.5 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full">
                        <button className="bg-white text-gray-800 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-50 transition-colors duration-300">
                            Explore Mauritius Now
                        </button>
                    </div>
                    <p className="text-gray-600 mt-4 text-sm">
                        Join thousands of travelers who've discovered paradise with Mauritius Paradise
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;