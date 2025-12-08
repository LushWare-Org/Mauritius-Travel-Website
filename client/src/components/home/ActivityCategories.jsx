import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ActivityCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const mockData = [
                    { slug: 'water-sports', title: 'Water Sports', icon: '🌊', description: 'Jet skiing, parasailing & more', count: 15, gradient: 'from-blue-400 to-cyan-400' },
                    { slug: 'cruises', title: 'Cruises', icon: '🚢', description: 'Sunset cruises & scenic tours', count: 8, gradient: 'from-purple-400 to-pink-400' },
                    { slug: 'island-tours', title: 'Island Tours', icon: '🏝️', description: 'Discover unique cultures', count: 12, gradient: 'from-orange-400 to-yellow-400' },
                    { slug: 'diving', title: 'Diving', icon: '🤿', description: 'Vibrant coral reefs', count: 20, gradient: 'from-cyan-400 to-blue-400' },
                    { slug: 'adventure', title: 'Adventure', icon: '⚡', description: 'Thrilling experiences', count: 18, gradient: 'from-red-400 to-orange-400' },
                    { slug: 'cultural', title: 'Cultural', icon: '🎭', description: 'Mauritius traditions', count: 10, gradient: 'from-green-400 to-emerald-400' },
                    { slug: 'wellness', title: 'Wellness', icon: '💆', description: 'Relaxing spa treatments', count: 9, gradient: 'from-pink-400 to-purple-400' },
                    { slug: 'other', title: 'Other', icon: '🎣', description: 'Traditional experiences', count: 7, gradient: 'from-indigo-400 to-purple-400' }
                ];
                setCategories(mockData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl mx-auto mb-6 animate-pulse"></div>
                        <div className="h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl max-w-md mx-auto mb-4 animate-pulse"></div>
                        <div className="h-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg max-w-lg mx-auto animate-pulse"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-24 bg-gradient-to-b from-white via-blue-50/20 to-white overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-100/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full mb-6">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-2"></div>
                        <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                            Explore Categories
                        </span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                        Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">Amazing</span> Adventures
                    </h1>
                    
                    <div className="w-24 h-1.5 bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 mx-auto mb-8 rounded-full shadow-lg"></div>
                    
                    <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed font-light">
                        Curated experiences showcasing the best of Mauritius. From underwater wonders to cultural treasures.
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    {categories.map((category, index) => (
                        <Link
                            to={`/activities?category=${category.slug}`}
                            key={category.slug}
                            className="group relative"
                            onMouseEnter={() => setHoveredCard(index)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            {/* Card Container */}
                            <div className={`relative h-full bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${
                                hoveredCard === index ? 'scale-105 -translate-y-2' : ''
                            }`}>
                                {/* Gradient Border */}
                                <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-gray-200/50 to-gray-100/50 -z-10">
                                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white to-gray-50"></div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Icon with Gradient */}
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-200/50 mx-auto`}>
                                        <span className="text-4xl">{category.icon}</span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-4 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r from-gray-900 to-gray-700 transition-all">
                                        {category.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-600 text-center mb-6 font-light leading-relaxed">
                                        {category.description}
                                    </p>

                                    {/* Activity Count */}
                                    <div className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 group-hover:border-gray-200 transition-colors">
                                        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-3 animate-pulse"></div>
                                        <span className="font-semibold text-gray-900">{category.count}</span>
                                        <span className="text-gray-500 ml-2">activities</span>
                                    </div>

                                    {/* Explore Button - Visible on Hover */}
                                    <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                                        hoveredCard === index ? 'translate-y-0' : 'translate-y-4'
                                    }`}>
                                        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-medium shadow-lg">
                                            <span>Explore</span>
                                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Background Pattern */}
                                <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-cyan-100/20 rounded-full -translate-y-16 translate-x-16"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/20 to-cyan-100/20 rounded-full translate-y-12 -translate-x-12"></div>
                                </div>
                            </div>

                            {/* Glow Effect */}
                            <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10 ${
                                hoveredCard === index ? 'animate-pulse' : ''
                            }`}></div>
                        </Link>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="text-center mb-20">
                    <Link
                        to="/activities"
                        className="group inline-flex items-center justify-center px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform"
                    >
                        <span className="text-lg">Browse All Activities</span>
                        <svg className="w-6 h-6 ml-4 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                    <p className="mt-6 text-gray-500 font-light">
                        <span className="text-blue-600 font-medium">100+</span> curated experiences • <span className="text-green-600 font-medium">Best Price</span> guarantee • <span className="text-purple-600 font-medium">24/7</span> support
                    </p>
                </div>

                {/* Stats */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-3xl blur-3xl"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-100 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center group">
                                <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 mb-4">
                                    100+
                                </div>
                                <div className="text-xl font-semibold text-gray-900 mb-2">Activities</div>
                                <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full group-hover:w-24 transition-all duration-300"></div>
                            </div>
                            
                            <div className="text-center group">
                                <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-cyan-400 mb-4">
                                    5★
                                </div>
                                <div className="text-xl font-semibold text-gray-900 mb-2">Rating</div>
                                <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 mx-auto rounded-full group-hover:w-24 transition-all duration-300"></div>
                            </div>
                            
                            <div className="text-center group">
                                <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 mb-4">
                                    24/7
                                </div>
                                <div className="text-xl font-semibold text-gray-900 mb-2">Support</div>
                                <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full group-hover:w-24 transition-all duration-300"></div>
                            </div>
                        </div>
                        
                        <div className="mt-12 pt-12 border-t border-gray-100 text-center">
                            <div className="inline-flex items-center text-gray-600">
                                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-light">Trusted by thousands of travelers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ActivityCategories;