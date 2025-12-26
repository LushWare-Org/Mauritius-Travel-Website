import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-sm border-b border-blue-700">
      {/* Mauritius Color Strip */}
      <div className="h-1 bg-gradient-to-r from-red-500 via-blue-400 to-green-500"></div>

      {/* Desktop Header */}
      <div className="hidden md:block py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center group">
              <i className="fas fa-phone-alt mr-2 text-yellow-400 group-hover:text-yellow-300 transition-colors"></i>
              <span className="group-hover:text-yellow-100 transition-colors">
                +230 5813 7644
              </span>
            </div>
            <div className="flex items-center group">
              <i className="fas fa-envelope mr-2 text-yellow-400 group-hover:text-yellow-300 transition-colors"></i>
              <span className="group-hover:text-yellow-100 transition-colors">
                mervbn01@gmail.com
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <Link
                to="/help"
                className="text-white hover:text-yellow-300 transition-colors mr-4 relative group"
              >
                Help Center
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden py-3 px-4">
        <div className="flex justify-between items-center">
          {/* Contact Info Button (Mobile) */}
          <button
            onClick={toggleMobileMenu}
            className="flex items-center text-white hover:text-yellow-300 transition-colors"
            aria-label="Toggle contact information"
          >
            <i className="fas fa-phone-alt mr-2 text-yellow-400"></i>
            <span className="text-sm">Contact</span>
            <i className={`fas fa-chevron-${isMobileMenuOpen ? 'up' : 'down'} ml-2 text-xs`}></i>
          </button>

          {/* Help Center Link (Mobile) */}
          <Link
            to="/help"
            className="text-white hover:text-yellow-300 transition-colors flex items-center"
          >
            <i className="fas fa-question-circle mr-13 text-yellow-400"></i>
          
          </Link>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="mt-3 pt-3 border-t border-blue-700 animate-fadeIn">
            <div className="space-y-3">
              {/* Phone Number */}
              <div className="flex items-center group">
                <i className="fas fa-phone-alt mr-3 text-yellow-400 w-4 text-center"></i>
                <a 
                  href="tel:+23058137644" 
                  className="text-white hover:text-yellow-300 transition-colors text-sm"
                >
                  +230 5813 7644
                </a>
              </div>
              
              {/* Email */}
              <div className="flex items-center group">
                <i className="fas fa-envelope mr-3 text-yellow-400 w-4 text-center"></i>
                <a 
                  href="mailto:mervbn01@gmail.com" 
                  className="text-white hover:text-yellow-300 transition-colors text-sm break-all"
                >
                  mervbn01@gmail.com
                </a>
              </div>
              
              {/* Help Center Link in Dropdown */}
              <div className="flex items-center group pt-2 border-t border-blue-700">
                <i className="fas fa-question-circle mr-3 text-yellow-400 w-4 text-center"></i>
                <Link 
                  to="/help" 
                  className="text-white hover:text-yellow-300 transition-colors text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Help Center
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;