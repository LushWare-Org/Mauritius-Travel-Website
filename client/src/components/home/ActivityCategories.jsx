import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
const ActivityCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    // Mock data - replace with actual API call
    useEffect(() => {
        // Simulating API call
        const fetchCategories = async () => {
            try {
                // Replace with your actual API endpoint
                // const response = await fetch('/api/activity-categories');
                // const data = await response.json();
              
                // Mock data - this should come from your database
                const mockData = [
                    { slug: 'water-sports', title: 'Water Sports', icon: '🏄‍♂️', description: 'Experience jet skiing, parasailing and more', count: 15 },
                    { slug: 'cruises', title: 'Cruises', icon: '🚢', description: 'Enjoy scenic boat tours and sunset cruises', count: 8 },
                    { slug: 'island-tours', title: 'Island Tours', icon: '🏝️', description: 'Discover multiple islands and their unique cultures', count: 12 },
                    { slug: 'diving', title: 'Diving', icon: '🤿', description: 'Explore vibrant coral reefs and underwater wonders', count: 20 },
                    { slug: 'adventure', title: 'Adventure', icon: '🧗‍♂️', description: 'Thrilling land and water based adventures', count: 18 },
                    { slug: 'cultural', title: 'Cultural', icon: '🎭', description: 'Immerse in Maldivian traditions and experiences', count: 10 },
                    { slug: 'wellness', title: 'Wellness', icon: '💆‍♀️', description: 'Relax with spa treatments overlooking the ocean', count: 9 },
                    { slug: 'fishing', title: 'Fishing', icon: '🎣', description: 'Traditional and sport fishing experiences', count: 7 }
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
            <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-blue-900 mb-4">Loading Categories...</h2>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
    return (
        <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                        Explore Excursions
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
                        Discover Amazing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Experiences</span>
                    </h2>
                    <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                        Choose from our curated collection of Maldivian adventures. From underwater marvels to cultural wonders, find your perfect excursion.
                    </p>
                </div>
              
                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {categories.map(category => (
                        <Link
                            to={`/activities?category=${category.slug}`}
                            key={category.slug}
                            className="group relative overflow-hidden rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                        >
                            {/* Gradient Background */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-400"></div>
                        
                            {/* Icon Container */}
                            <div className="p-8 pb-6 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-50 group-hover:from-blue-200 group-hover:to-teal-100 transition-all duration-300 mb-6">
                                    <span className="text-4xl">{category.icon}</span>
                                </div>
                              
                                {/* Title */}
                                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-700 transition-colors">
                                    {category.title}
                                </h3>
                              
                                {/* Description */}
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {category.description}
                                </p>
                              
                                {/* Activity Count */}
                                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
                                    <span className="text-sm font-semibold text-blue-700">
                                        {category.count} excursions
                                    </span>
                                </div>
                            </div>
                        
                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-700/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                                <p className="text-white text-lg font-semibold mb-4">{category.description}</p>
                                <div className="inline-flex items-center text-white">
                                    <span className="text-sm font-medium mr-2">Explore Now</span>
                                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
              
                {/* CTA Button */}
                <div className="text-center">
                    <Link
                        to="/activities"
                        className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                    >
                        <span className="mr-3">View All Excursions</span>
                        <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                    </Link>
                  
                    {/* Additional Info */}
                    <p className="mt-6 text-gray-500 text-sm">
                        Over 100+ excursions available • Best price guarantee • 24/7 support
                    </p>
                </div>
              
                {/* Decorative Elements */}
                <div className="mt-20 relative">
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20"></div>
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-200 rounded-full opacity-20"></div>
                    <div className="flex justify-center items-center space-x-8 text-gray-400">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">100+</div>
                            <div className="text-sm">Excursions</div>
                        </div>
                        <div className="w-1 h-12 bg-gradient-to-b from-blue-300 to-teal-300"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">24/7</div>
                            <div className="text-sm">Support</div>
                        </div>
                        <div className="w-1 h-12 bg-gradient-to-b from-blue-300 to-teal-300"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">5★</div>
                            <div className="text-sm">Rating</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
export default ActivityCategories;