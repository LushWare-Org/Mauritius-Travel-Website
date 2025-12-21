import React, { useState } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Check if user is admin, if not redirect to home
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Sidebar links - UPDATED with correct icons and paths
  const navLinks = [
    { path: '/admin/dashboard', icon: 'fa-tachometer-alt', text: 'Dashboard' },
    {
      path: '/admin/activities',
      icon: 'fa-umbrella-beach',
      text: 'Excursions',
    },
    {
      path: '/admin/bookings',
      icon: 'fa-calendar-check',
      text: 'Excursion Bookings',
    },
    { path: '/admin/users', icon: 'fa-users', text: 'Users' },
    {
      path: '/admin/tour-packages',
      icon: 'fa-umbrella-beach',
      text: 'TourPackages',
    },
    {
      path: '/admin/tour-package-bookings',
      icon: 'fa-calendar-check',
      text: 'Tour Bookings',
    },

    {
      path: '/admin/dashboard?tab=contacts',
      icon: 'fa-envelope',
      text: 'Contact Inquiries',
    },
    {
      path: '/admin/airport-transfers',
      icon: 'fa-plane',
      text: 'Airport Transfers',
    },
    {
      path: '/admin/airport-transfer-bookings',
      icon: 'fa-plane',
      text: 'Airport Transfers Bookings',
    },

    {
      path: '/admin/activity-reviews',
      icon: 'fa-plane',
      text: 'Excursion Reviews',
    },
  ];

  // Check if link is active (including query parameters)
  const isActive = (path) => {
    // Extract path and query parameters
    const [pathPart, queryPart] = path.split('?');

    // Check if the current location matches the path
    if (
      location.pathname !== pathPart &&
      location.pathname !== '/admin/dashboard'
    ) {
      return false;
    }

    // For paths with query parameters (dashboard tabs)
    if (queryPart) {
      const queryParams = new URLSearchParams(queryPart);
      const currentParams = new URLSearchParams(location.search);
      const tab = queryParams.get('tab');
      const currentTab = currentParams.get('tab');

      // If we're on dashboard and the tab matches
      if (location.pathname === '/admin/dashboard') {
        if (tab && currentTab) {
          return tab === currentTab;
        }
        // If no tab in URL but we're looking for dashboard, it's the default dashboard
        return !tab && !currentTab;
      }
    }

    // For exact path matches
    return location.pathname === path;
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    // Check for dashboard tabs first
    if (location.pathname === '/admin/dashboard') {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'contacts') return 'Contact Inquiries';
      if (tab === 'airport-transfers') return 'Airport Transfers';
      return 'Dashboard';
    }

    // Check for other pages
    const currentLink = navLinks.find(
      (link) => location.pathname === link.path
    );
    return currentLink ? currentLink.text : 'Admin Panel';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Mobile Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-75' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 flex flex-col w-72 bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <i className="fas fa-times text-white"></i>
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-center px-6 py-4 border-b border-blue-700/50">
              <Link to="/" className="flex items-center group">
                <div className="text-2xl font-bold text-white font-display flex items-center">
                  <span className="text-yellow-400 mr-1 group-hover:rotate-12 transition-transform duration-300">
                    <i className="fas fa-umbrella-beach drop-shadow-md"></i>
                  </span>
                  <span className="group-hover:text-yellow-100 transition-colors">
                    Holiday
                  </span>
                  <span className="text-yellow-400 ml-1 group-hover:scale-105 transition-transform duration-300">
                    Vibes
                  </span>
                </div>
              </Link>
            </div>
            <nav className="mt-6 px-3 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-white/10 text-white shadow-sm border-l-4 border-yellow-400'
                      : 'text-blue-100 hover:bg-white/5 hover:border-l-4 hover:border-yellow-400/50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i
                    className={`fas ${link.icon} mr-4 ${
                      isActive(link.path)
                        ? 'text-yellow-400'
                        : 'text-blue-300 group-hover:text-yellow-400'
                    }`}
                  ></i>
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-blue-700/50 p-4 bg-blue-900/30">
            <Link to="/" className="flex-shrink-0 group block w-full">
              <div className="flex items-center">
                <div>
                  <span className="inline-block h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                    <i className="fas fa-user text-blue-200"></i>
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">
                    {currentUser?.name || currentUser?.email}
                  </p>
                  <p className="text-sm font-medium text-blue-200 group-hover:text-blue-100 flex items-center">
                    <i className="fas fa-external-link-alt text-xs mr-1"></i>{' '}
                    View site
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-72 z-30">
        <div className="h-full flex flex-col bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-xl">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-center flex-shrink-0 px-6 py-4 border-b border-blue-700/50">
              <Link to="/" className="flex items-center group">
                <div className="text-2xl font-bold text-white font-display flex items-center">
                  <img
                    src={logo}
                    alt="Holiday Vibes Logo"
                    className="h-8 w-8 mr-2 group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="group-hover:text-yellow-100 transition-colors">
                    Holiday
                  </span>
                  <span className="text-yellow-400 ml-1 group-hover:scale-105 transition-transform duration-300">
                    Vibes
                  </span>
                </div>
              </Link>
            </div>
            <nav className="mt-6 flex-1 px-3 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-white/10 text-white shadow-sm border-l-4 border-yellow-400'
                      : 'text-blue-100 hover:bg-white/5 hover:border-l-4 hover:border-yellow-400/50'
                  }`}
                >
                  <i
                    className={`fas ${link.icon} mr-3 ${
                      isActive(link.path)
                        ? 'text-yellow-400'
                        : 'text-blue-300 group-hover:text-yellow-400'
                    }`}
                  ></i>
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-blue-700/50 p-4 bg-blue-900/30">
            <Link to="/" className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <span className="inline-block h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                    <i className="fas fa-user text-blue-200"></i>
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {currentUser?.name || currentUser?.email}
                  </p>
                  <p className="text-xs font-medium text-blue-200 group-hover:text-blue-100 flex items-center">
                    <i className="fas fa-external-link-alt text-xs mr-1"></i>{' '}
                    View site
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72 mt-14">

        {' '}
        {/* Added ml-72 to account for fixed sidebar */}
        {/* Mobile top bar */}
        <div className="lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex justify-between items-center bg-white shadow-sm z-20">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <i className="fas fa-bars text-gray-600 text-xl"></i>
          </button>

          <div className="px-4 py-2 text-lg font-semibold text-gray-700">
            {getCurrentPageTitle()}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="p-2 mr-2 flex items-center focus:outline-none"
            >
              {/* Make this container larger */}
              <span className="inline-block h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                <i className="fas fa-user text-white text-base"></i>{' '}
                {/* Increased text size */}
              </span>
            </button>

            {userMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <Link
                  to="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View User Site
                </Link>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Desktop top bar - Fixed */}
        <div className="hidden lg:block fixed top-0 right-0 left-72 h-16 bg-white shadow-sm z-20">
          <div className="h-full flex justify-between items-center px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {getCurrentPageTitle()}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User dropdown */}
              <div className="relative">
                <div>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center">
                      <span className="inline-block h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-md mr-2">
                        <span className="text-white font-medium">
                          {currentUser.name
                            ? currentUser.name.charAt(0).toUpperCase()
                            : currentUser.email.charAt(0).toUpperCase()}
                        </span>
                      </span>
                      <span className="text-sm font-medium text-gray-700 mr-1">
                        {currentUser.name || currentUser.email}
                      </span>
                      <i className="fas fa-chevron-down text-xs text-gray-500"></i>
                    </div>
                  </button>
                </div>

                {userMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <Link
                      to="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      View Site
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Main content - Scrollable area */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          {' '}
          {/* Added pt-16 for top bar spacing */}
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
