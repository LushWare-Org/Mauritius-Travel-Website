import React from 'react';
import { Car, Clock, Shield, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

const AirportTransferTab = () => {
    const features = [
        {
            icon: <Car className="w-5 h-5" />,
            title: "Premium Fleet",
            description: "Luxury vehicles"
        },
        {
            icon: <Clock className="w-5 h-5" />,
            title: "24/7 Service",
            description: "Always available"
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: "Safe & Secure",
            description: "Licensed drivers"
        },
        {
            icon: <CreditCard className="w-5 h-5" />,
            title: "Best Rates",
            description: "No hidden fees"
        }
    ];

    return (
        <section className="py-16 px-4 bg-gradient-to-b from-blue-50/30 to-white">
            <div className="max-w-6xl mx-auto">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-shadow duration-300">
                    {/* Header with blue accent */}
                    <div className="p-8 md:p-12 border-b border-blue-50">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                            {/* Left Content */}
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                        <Car className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                                        Premium Airport Transfers
                                    </span>
                                </div>
                                
                                <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
                                    Seamless Airport 
                                    <span className="font-bold text-blue-700"> Transfers</span>
                                </h2>
                                
                                <p className="text-gray-600 text-lg mb-8 max-w-2xl">
                                    Experience luxury transportation with our premium fleet. 
                                    Professional service from airport to your destination.
                                </p>
                                
                                {/* Features Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {features.map((feature, index) => (
                                        <div 
                                            key={index}
                                            className="group p-4 rounded-xl border border-blue-50 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition-colors">
                                                    <div className="text-blue-600">
                                                        {feature.icon}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Right CTA */}
                            <div className="lg:pl-8 lg:border-l lg:border-blue-100">
                                <div className="sticky top-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 shadow-sm">
                                        <div className="text-center mb-6">
                                            <div className="inline-flex items-center justify-center gap-2 text-sm text-blue-600 mb-3 font-medium">
                                                <Clock className="w-4 h-4" />
                                                <span>Real-time tracking</span>
                                            </div>
                                            <div className="text-3xl font-bold text-blue-700 mb-1">From $49</div>
                                            <div className="text-sm text-gray-500">per transfer</div>
                                        </div>
                                        
                                        <button
                                            onClick={() => window.location.href = '/airport-transfers'}
                                            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                                        >
                                            <span>Book Now</span>
                                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                        
                                        <div className="mt-6 space-y-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <span>Meet & greet included</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <span>Flight monitoring</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <span>30-min free waiting</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 bg-blue-50/50">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2 text-blue-700">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    Available now
                                </span>
                                <span className="text-blue-300">•</span>
                                <span className="text-gray-700">Multiple vehicle options</span>
                            </div>
                            
                            <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 group transition-colors">
                                <span>Learn more</span>
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Additional Info (Optional) */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        ✈️ Serving all major airports • 🚗 Sedan, SUV & Van options • 📱 Mobile app available
                    </p>
                </div>
            </div>
        </section>
    );
};

export default AirportTransferTab;