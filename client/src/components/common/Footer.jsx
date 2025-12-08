import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white p-6">
            <div className="container mx-auto">
                <div className="border-t border-white/20 pt-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-center md:text-left text-white/90 mb-4 md:mb-0">
                            &copy; {new Date().getFullYear()} Mauritius Island Adventures. All rights reserved.
                        </p>
                        
                        {/* Mauritius Flag Color Strip */}
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-sm text-white/80">Proudly representing Mauritius</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;