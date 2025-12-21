import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
    const [backgroundIndex, setBackgroundIndex] = useState(0);

    // High-quality Mauritius background images
    const backgroundImages = [
        "https://images.pexels.com/photos/3525724/pexels-photo-3525724.jpeg",
        "https://images.pexels.com/photos/3446207/pexels-photo-3446207.jpeg",
        "https://images.pexels.com/photos/3703465/pexels-photo-3703465.jpeg",
        "https://images.pexels.com/photos/279010/pexels-photo-279010.jpeg",
        "https://images.pexels.com/photos/7425280/pexels-photo-7425280.jpeg"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setBackgroundIndex(prev => (prev + 1) % backgroundImages.length);
        }, 8000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background image carousel */}
            {backgroundImages.map((image, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 z-0 transition-all duration-1000 ease-in-out ${
                        index === backgroundIndex 
                            ? 'opacity-100' 
                            : 'opacity-0'
                    }`}
                    style={{
                        backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%), url('${image}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            ))}
            
            {/* Mauritius Flag Color Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-blue-400/10 to-green-500/10 z-0"></div>
            
            {/* Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Mauritius Badge */}
                    <div className="inline-flex items-center mb-6 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <div className="flex space-x-1 mr-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-white text-sm font-medium">Welcome to Mauritius</span>
                    </div>
                    
                    {/* Main Heading */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                        Discover the Magic of
                        <span className="block text-yellow-300 mt-3">Mauritius</span>
                    </h1>
                    
                    {/* Subheading */}
                    <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed">
                        Premium tours, unforgettable experiences, and authentic island adventures.
                        Your perfect getaway starts here.
                    </p>
                    
                    {/* Primary CTA */}
                    <div className="mb-12">
                        <Link 
                            to="/tour-packages" 
                            className="group inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg py-4 px-10 rounded-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 shadow-lg"
                        >
                            <span className="mr-3">Explore Mauritius</span>
                            <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                        </Link>
                    </div>
                    
                    {/* Secondary CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/activities" 
                            className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg border border-white/30 transition-all duration-300 hover:border-white/50 hover:scale-105"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            Browse Activities
                        </Link>
                        <Link 
                            to="/airport-transfers" 
                            className="inline-flex items-center justify-center bg-yellow-400/20 backdrop-blur-sm hover:bg-yellow-400/30 text-white font-medium py-3 px-6 rounded-lg border border-yellow-400/30 transition-all duration-300 hover:border-yellow-400/50 hover:scale-105"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Airport Transfers
                        </Link>
                    </div>
                </div>
                
                {/* Indicators */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="flex flex-col items-center">
                      
                        
                        {/* Scroll Indicator */}
                        <div className="text-center">
                            <svg className="w-6 h-6 text-white/60 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent z-1"></div>
        </div>
    );
};

export default HeroSection;