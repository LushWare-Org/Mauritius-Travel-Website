import React from 'react';

const About = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-800 to-blue-600 rounded-full mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    About Mauritius Paradise
                </h1>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Your premier destination for unforgettable island experiences
                </p>
            </div>

            {/* Cards Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Card 1 */}
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-2xl text-blue-800">🏝️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Island Experiences</h3>
                    </div>
                    <p className="text-gray-700">
                        Curated excursions showcasing Mauritius' beauty and culture. From underwater adventures to cultural tours.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-2xl text-green-700">✈️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Seamless Transfers</h3>
                    </div>
                    <p className="text-gray-700">
                        Reliable airport transfers with meet & greet service. Comfortable vehicles for all group sizes.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-2xl text-red-700">👨‍👩‍👧‍👦</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Local Expertise</h3>
                    </div>
                    <p className="text-gray-700">
                        Deep local knowledge and partnerships with the island's best operators for authentic experiences.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-blue-800 mb-2">150+</div>
                        <div className="text-gray-700 font-medium">Excursions</div>
                        <p className="text-gray-500 text-sm mt-1">Adventure, culture & nature</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-green-700 mb-2">24/7</div>
                        <div className="text-gray-700 font-medium">Airport Service</div>
                        <p className="text-gray-500 text-sm mt-1">Reliable transfers</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-red-700 mb-2">50+</div>
                        <div className="text-gray-700 font-medium">Hotel Partners</div>
                        <p className="text-gray-500 text-sm mt-1">Luxury to budget options</p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-3xl mx-auto text-center">
                <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Ready for Your Adventure?</h3>
                    <p className="mb-6 opacity-90">
                        Join thousands of travelers who've discovered paradise with us
                    </p>
                    <a 
                        href="/activities" 
                        className="inline-block bg-white text-blue-800 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Explore Activities
                    </a>
                </div>
            </div>
        </div>
    );
};

export default About;