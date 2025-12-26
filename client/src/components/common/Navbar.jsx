import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setProfileDropdownOpen(false);
  }, [location]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-sm ${
        scrolled
          ? 'bg-blue-900/95 shadow-lg py-2'
          : 'bg-gradient-to-r from-blue-950 to-blue-800 py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Holiday Vibes Logo"
                className="h-12 w-12 mr-2 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="flex flex-col">
                <span className="text-white font-bold text-base sm:text-lg group-hover:text-yellow-100 transition-colors whitespace-nowrap">
                  Holiday Vibes
                </span>
                <span className="text-yellow-400 text-sm sm:text-base group-hover:scale-105 transition-transform duration-300 whitespace-nowrap">
                  Tour Ltd
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-white hover:text-yellow-400 transition-colors relative ${
                location.pathname === '/'
                  ? 'font-semibold text-yellow-400'
                  : 'hover:scale-105 transform'
              }`}
            >
              Home
              {location.pathname === '/' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400"></span>
              )}
              {location.pathname !== '/' && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>

            <Link
              to="/tour-packages"
              className={`text-white hover:text-yellow-400 transition-colors relative ${
                location.pathname === '/tour-packages'
                  ? 'font-semibold text-yellow-400'
                  : 'hover:scale-105 transform'
              }`}
            >
              Tour Packages
              {location.pathname === '/tour-packages' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400"></span>
              )}
              {location.pathname !== '/tour-packages' && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              to="/activities"
              className={`text-white hover:text-yellow-400 transition-colors relative ${
                location.pathname === '/activities'
                  ? 'font-semibold text-yellow-400'
                  : 'hover:scale-105 transform'
              }`}
            >
              Excursions
              {location.pathname === '/activities' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400"></span>
              )}
              {location.pathname !== '/activities' && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              to="/airport-transfers"
              className={`text-white hover:text-yellow-400 transition-colors relative ${
                location.pathname === '/airport-transfers'
                  ? 'font-semibold text-yellow-400'
                  : 'hover:scale-105 transform'
              }`}
            >
              Airport Transfers
              {location.pathname === '/airport-transfers' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400"></span>
              )}
              {location.pathname !== '/airport-transfers' && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              to="/about"
              className={`text-white hover:text-yellow-400 transition-colors relative ${
                location.pathname === '/about'
                  ? 'font-semibold text-yellow-400'
                  : 'hover:scale-105 transform'
              }`}
            >
              About
              {location.pathname === '/about' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400"></span>
              )}
              {location.pathname !== '/about' && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
            <Link
              to="/contact"
              className={`text-white hover:text-yellow-400 transition-colors relative ${
                location.pathname === '/contact'
                  ? 'font-semibold text-yellow-400'
                  : 'hover:scale-105 transform'
              }`}
            >
              Contact
              {location.pathname === '/contact' && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-yellow-400"></span>
              )}
              {location.pathname !== '/contact' && (
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              )}
            </Link>
          </div>

          {/* User Authentication Section (Desktop) */}
          <div className="hidden md:flex items-center">
            {currentUser ? (
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 text-white hover:text-yellow-400 group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md group-hover:shadow-yellow-400/30 transition-all border border-yellow-400/20 group-hover:border-yellow-400/50">
                    <span className="text-white font-bold group-hover:scale-110 transition-transform">
                      {currentUser.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : currentUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden lg:inline">
                    {currentUser.name || currentUser.email.split('@')[0]}
                  </span>
                  <i className="fas fa-chevron-down text-xs group-hover:rotate-180 transition-transform duration-300"></i>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-md shadow-lg z-10 border border-blue-200/20 overflow-hidden animate-fade-in-down">
                    <div className="py-1">
                      {currentUser.role === 'admin' ? (
                        <>
                          {/* Admin specific links */}
                          <div className="space-y-0.5 px-2">
                            <Link
                              to="/admin/dashboard"
                              className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
                            >
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs shadow">
                                <i className="fas fa-tachometer-alt"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-purple-700 truncate">
                                  Dashboard
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Overview & Analytics
                                </div>
                              </div>
                            </Link>

                            <Link
                              to="/admin/tour-packages"
                              className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs shadow">
                                <i className="fas fa-suitcase-rolling"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-amber-700 truncate">
                                  Tour Packages
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Manage Packages
                                </div>
                              </div>
                            </Link>

                            <Link
                              to="/admin/tour-package-bookings"
                              className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-violet-50 rounded-md transition-colors"
                            >
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs shadow">
                                <i className="fas fa-ticket-alt"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-violet-700 truncate">
                                  Tour Bookings
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Package Reservations
                                </div>
                              </div>
                            </Link>
                            <Link
                              to="/admin/activities"
                              className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs shadow">
                                <i className="fas fa-water"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-blue-700 truncate">
                                  Excursions
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Manage Activities
                                </div>
                              </div>
                            </Link>

                            <Link
                              to="/admin/bookings"
                              className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white text-xs shadow">
                                <i className="fas fa-calendar-check"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-emerald-700 truncate">
                                  Excursion Bookings
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Activity Reservations
                                </div>
                              </div>
                            </Link>

                            {/* Airport Services Section */}
                            <div className="mt-2 border-t border-gray-100 pt-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-2">
                                Airport Services
                              </div>

                              <Link
                                to="/admin/airport-transfers"
                                className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-indigo-50 rounded-md transition-colors"
                              >
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs shadow">
                                  <i className="fas fa-plane"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm group-hover:text-indigo-700 truncate">
                                    Transfers
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    Transport Services
                                  </div>
                                </div>
                              </Link>

                              <Link
                                to="/admin/airport-transfer-bookings"
                                className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-cyan-50 rounded-md transition-colors"
                              >
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-xs shadow">
                                  <i className="fas fa-ticket-alt"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm group-hover:text-cyan-700 truncate">
                                    Transfer Bookings
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    Reservation Management
                                  </div>
                                </div>
                              </Link>

                              <Link
                                to="/admin/users"
                                className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-md transition-colors"
                              >
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs shadow">
                                  <i className="fas fa-users"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm group-hover:text-orange-700 truncate">
                                    Users
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    Manage Accounts
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <Link
                              to="/admin/dashboard?tab=contacts"
                              className="group flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-pink-50 rounded-md transition-colors"
                            >
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs shadow">
                                <i className="fas fa-address-book"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-pink-700 truncate">
                                  Contact Messages
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  Customer Support
                                </div>
                              </div>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Regular user links */}
                          <div className="grid grid-cols-2 gap-2 px-3 py-2">
                            {/* Dashboard */}
                            <Link
                              to="/dashboard"
                              className="group relative block p-3 text-gray-800 hover:bg-gradient-to-br hover:from-blue-50 hover:to-white rounded-lg transition-all duration-250 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 hover:border-blue-200"
                            >
                              <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-250 mb-2">
                                  <i className="fas fa-tachometer-alt text-base"></i>
                                </div>
                                <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                                  Dashboard
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors mt-0.5">
                                  Overview
                                </div>
                              </div>
                            </Link>

                            {/* Profile */}
                            <Link
                              to="/profile"
                              className="group relative block p-3 text-gray-800 hover:bg-gradient-to-br hover:from-purple-50 hover:to-white rounded-lg transition-all duration-250 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 hover:border-purple-200"
                            >
                              <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-250 mb-2">
                                  <i className="fas fa-user text-base"></i>
                                </div>
                                <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors text-sm">
                                  Profile
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-purple-500 transition-colors mt-0.5">
                                  Account
                                </div>
                              </div>
                            </Link>
                            {/* Tour Package Bookings */}
                            <Link
                              to="/dashboard/tour-package-bookings"
                              className="group relative block p-3 text-gray-800 hover:bg-gradient-to-br hover:from-amber-50 hover:to-white rounded-lg transition-all duration-250 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 hover:border-amber-200"
                            >
                              <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-250 mb-2">
                                  <i className="fas fa-suitcase-rolling text-base"></i>
                                </div>
                                <div className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors text-sm">
                                  Tour Bookings
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-amber-500 transition-colors mt-0.5">
                                  Package Reservations
                                </div>
                              </div>
                            </Link>

                            {/* Bookings */}
                            <Link
                              to="/dashboard/bookings"
                              className="group relative block p-3 text-gray-800 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-white rounded-lg transition-all duration-250 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 hover:border-emerald-200"
                            >
                              <div className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-250 mb-2">
                                  <i className="fas fa-calendar-check text-base"></i>
                                </div>
                                <div className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors text-sm">
                                  Excursion Bookings
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-emerald-500 transition-colors mt-0.5">
                                  Reservations
                                </div>
                              </div>
                            </Link>
                          </div>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="group relative w-full text-left px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-white transition-all duration-250 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-250 mr-3">
                            <i className="fas fa-sign-out-alt text-sm"></i>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-red-700 transition-colors text-sm">
                              Sign Out
                            </div>
                            <div className="text-xs text-gray-500 group-hover:text-red-500 transition-colors mt-0.5">
                              Logout from account
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white mr-4 hover:text-yellow-400 hover:scale-105 transition-transform flex items-center"
                >
                  <i className="fas fa-user mr-1"></i> Login
                </Link>
                <Link
                  to="/activities"
                  className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-blue-900 px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-yellow-400/50 border border-yellow-300/50"
                >
                  Book Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Book Now button for mobile - always visible */}
            <Link
              to="/activities"
              className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-blue-900 px-2 py-1.5 rounded-full font-semibold text-xs transition-all transform hover:scale-105 shadow-md hover:shadow-yellow-400/50 border border-yellow-300/50 whitespace-nowrap flex items-center"
            >
              <i className="fas fa-calendar-check mr-1 text-[10px]"></i>
              <span className="hidden xs:inline">Book</span>
              <span className="xs:hidden">Book</span>
            </Link>

            {/* User profile icon for logged in users on mobile */}
            {currentUser && (
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full shadow-md border border-yellow-400/30">
                <span className="text-white font-bold text-xs">
                  {currentUser.name
                    ? currentUser.name.charAt(0).toUpperCase()
                    : currentUser.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 focus:outline-none transition-all transform hover:scale-110 active:scale-95"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? (
                <i className="fas fa-times text-xl text-yellow-400"></i>
              ) : (
                <i className="fas fa-bars text-xl hover:text-yellow-400"></i>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ${
            isOpen
              ? 'max-h-[80vh] opacity-100 overflow-y-auto'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="pt-3 pb-4 bg-gradient-to-b from-blue-900/95 to-blue-950/95 backdrop-blur-md mt-3 px-4 py-4 rounded-lg shadow-xl border border-blue-700/50">
            {/* Navigation Links */}
            <div className="space-y-2">
              <Link
                to="/"
                className={`flex items-center py-2.5 px-3 rounded-lg transition-all ${
                  location.pathname === '/'
                    ? 'bg-blue-800/50 text-yellow-400 font-semibold'
                    : 'text-white hover:bg-blue-800/30 hover:text-yellow-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-home w-5 mr-3 text-center"></i>
                <span>Home</span>
                {location.pathname === '/' && (
                  <i className="fas fa-circle text-xs ml-auto text-yellow-400"></i>
                )}
              </Link>

              <Link
                to="/tour-packages"
                className={`flex items-center py-2.5 px-3 rounded-lg transition-all ${
                  location.pathname === '/tour-packages'
                    ? 'bg-blue-800/50 text-yellow-400 font-semibold'
                    : 'text-white hover:bg-blue-800/30 hover:text-yellow-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-suitcase-rolling w-5 mr-3 text-center"></i>
                <span>Tour Packages</span>
                {location.pathname === '/tour-packages' && (
                  <i className="fas fa-circle text-xs ml-auto text-yellow-400"></i>
                )}
              </Link>

              <Link
                to="/activities"
                className={`flex items-center py-2.5 px-3 rounded-lg transition-all ${
                  location.pathname === '/activities'
                    ? 'bg-blue-800/50 text-yellow-400 font-semibold'
                    : 'text-white hover:bg-blue-800/30 hover:text-yellow-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-water w-5 mr-3 text-center"></i>
                <span>Excursions</span>
                {location.pathname === '/activities' && (
                  <i className="fas fa-circle text-xs ml-auto text-yellow-400"></i>
                )}
              </Link>

              <Link
                to="/airport-transfers"
                className={`flex items-center py-2.5 px-3 rounded-lg transition-all ${
                  location.pathname === '/airport-transfers'
                    ? 'bg-blue-800/50 text-yellow-400 font-semibold'
                    : 'text-white hover:bg-blue-800/30 hover:text-yellow-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-plane w-5 mr-3 text-center"></i>
                <span>Airport Transfers</span>
                {location.pathname === '/airport-transfers' && (
                  <i className="fas fa-circle text-xs ml-auto text-yellow-400"></i>
                )}
              </Link>

              <Link
                to="/about"
                className={`flex items-center py-2.5 px-3 rounded-lg transition-all ${
                  location.pathname === '/about'
                    ? 'bg-blue-800/50 text-yellow-400 font-semibold'
                    : 'text-white hover:bg-blue-800/30 hover:text-yellow-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-info-circle w-5 mr-3 text-center"></i>
                <span>About</span>
                {location.pathname === '/about' && (
                  <i className="fas fa-circle text-xs ml-auto text-yellow-400"></i>
                )}
              </Link>

              <Link
                to="/contact"
                className={`flex items-center py-2.5 px-3 rounded-lg transition-all ${
                  location.pathname === '/contact'
                    ? 'bg-blue-800/50 text-yellow-400 font-semibold'
                    : 'text-white hover:bg-blue-800/30 hover:text-yellow-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-envelope w-5 mr-3 text-center"></i>
                <span>Contact</span>
                {location.pathname === '/contact' && (
                  <i className="fas fa-circle text-xs ml-auto text-yellow-400"></i>
                )}
              </Link>
            </div>

            {/* Authentication Section */}
            {currentUser ? (
              <>
                <div className="border-t border-blue-700 pt-3 mt-3">
                  <div className="text-xs font-semibold text-yellow-300/80 uppercase tracking-wider px-3 py-2">
                    My Account
                  </div>

                  {currentUser.role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center py-2.5 px-3 rounded-lg text-white hover:bg-blue-800/30 hover:text-yellow-300 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-user-shield w-5 mr-3 text-center"></i>
                      <span className="flex-1">Admin Panel</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center py-2.5 px-3 rounded-lg text-white hover:bg-blue-800/30 hover:text-yellow-300 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        <i className="fas fa-tachometer-alt w-5 mr-3 text-center"></i>
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center py-2.5 px-3 rounded-lg text-white hover:bg-blue-800/30 hover:text-yellow-300 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-bold">
                            {currentUser.name
                              ? currentUser.name.charAt(0).toUpperCase()
                              : currentUser.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/dashboard/tour-package-bookings"
                        className="flex items-center py-2.5 px-3 rounded-lg text-white hover:bg-blue-800/30 hover:text-yellow-300 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        <i className="fas fa-suitcase-rolling w-5 mr-3 text-center"></i>
                        <span>Tour Package Bookings</span>
                      </Link>
                      <Link
                        to="/dashboard/bookings"
                        className="flex items-center py-2.5 px-3 rounded-lg text-white hover:bg-blue-800/30 hover:text-yellow-300 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        <i className="fas fa-calendar-check w-5 mr-3 text-center"></i>
                        <span>Excursion Bookings</span>
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center py-2.5 px-3 rounded-lg text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-all"
                  >
                    <i className="fas fa-sign-out-alt w-5 mr-3 text-center"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-t border-blue-700 pt-3 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-center py-2.5 px-3 rounded-lg bg-blue-800/40 text-white hover:bg-blue-700/60 hover:text-yellow-300 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-user mr-2"></i>
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center justify-center py-2.5 px-3 rounded-lg bg-yellow-500/90 hover:bg-yellow-400 text-blue-900 font-semibold transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="fas fa-user-plus mr-2"></i>
                      <span>Sign Up</span>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Prominent Book Now Button at bottom */}
            <div className="mt-4 pt-3 border-t border-yellow-500/30">
              <Link
                to="/activities"
                className="block w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-blue-900 px-4 py-3 rounded-lg font-bold text-center transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-yellow-400/50"
                onClick={() => setIsOpen(false)}
              >
                <i className="fas fa-calendar-check mr-2"></i>
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
