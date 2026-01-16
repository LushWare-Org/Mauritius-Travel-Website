import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { dashboardAPI, activitiesAPI, tourPackagesAPI, tourPackageBookingsAPI } from '../../utils/api';
import AdminContacts from './AdminContacts.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalTourPackages: 0,
    totalBookings: 0,
    totalUsers: 0,
    pendingBookings: 0,
    totalContacts: 0,
    unreadContacts: 0,
    tourPackageBookings: {
      totalBookings: 0,
      totalRevenue: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [tourPackagesLoading, setTourPackagesLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTourPackageBookings, setRecentTourPackageBookings] = useState([]);
  
  // Add state for activities breakdown
  const [activitiesBreakdown, setActivitiesBreakdown] = useState({
    total: 0,
    active: 0,
    featured: 0
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get active tab from URL parameters
  const params = new URLSearchParams(location.search);
  const activeTab = params.get('tab') || 'dashboard';

  useEffect(() => {
    fetchDashboardData();
    fetchActivitiesData();
    fetchTourPackagesData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching dashboard data...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to access the admin dashboard');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        setLoading(false);
        return;
      }

      const response = await dashboardAPI.getStats();
      console.log('Dashboard response:', response);
      
      if (response && response.data && response.data.success) {
        const { 
          totalBookings, 
          totalUsers, 
          pendingBookings, 
          recentBookings,
          totalContacts,
          unreadContacts
        } = response.data.data;
        
        setStats(prevStats => ({
          ...prevStats,
          totalBookings: totalBookings || 0,
          totalUsers: totalUsers || 0,
          pendingBookings: pendingBookings || 0,
          totalContacts: totalContacts || 0,
          unreadContacts: unreadContacts || 0
        }));
        
        setRecentBookings(recentBookings || []);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch activities count
  const fetchActivitiesData = async () => {
    setActivitiesLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for activities fetch');
        return;
      }

      console.log('Fetching activities data...');
      const response = await activitiesAPI.getAll();
      console.log('Activities API response:', response);
      
      if (response && response.data) {
        if (response.data.success) {
          const activitiesData = response.data.data || [];
          console.log('Activities count:', activitiesData.length);
          
          const totalActivities = activitiesData.length;
          const activeActivities = activitiesData.filter(activity => 
            activity.status === 'active' || activity.isActive === true
          ).length;
          const featuredActivities = activitiesData.filter(activity => 
            activity.featured === true || activity.isFeatured === true
          ).length;
          
          // Update stats and activities breakdown
          setStats(prevStats => ({
            ...prevStats,
            totalActivities
          }));
          
          setActivitiesBreakdown({
            total: totalActivities,
            active: activeActivities,
            featured: featuredActivities
          });
          
          console.log('Activities stats updated:', {
            total: totalActivities,
            active: activeActivities,
            featured: featuredActivities
          });
        } else {
          console.error('Activities API returned success: false', response.data);
        }
      } else {
        console.error('Invalid activities API response:', response);
      }
    } catch (error) {
      console.error('Error fetching activities data:', error);
      // Set default values on error
      setActivitiesBreakdown({
        total: 0,
        active: 0,
        featured: 0
      });
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Separate function to fetch tour packages data
  const fetchTourPackagesData = async () => {
    setTourPackagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found for tour packages fetch');
        return;
      }

      console.log('Fetching tour packages data...');
      
      // Fetch tour packages count
      const packagesResponse = await tourPackagesAPI.getAll();
      const tourPackagesData = packagesResponse.data.data || [];
      const totalTourPackages = tourPackagesData.length;
      
      // Fetch tour package bookings
      const bookingsResponse = await tourPackageBookingsAPI.getAllAdmin();
      const tourBookingsData = bookingsResponse.data.data || [];
      
      // Calculate tour package booking stats
      const totalTourBookings = tourBookingsData.length;
      const pendingTourBookings = tourBookingsData.filter(b => 
        b.status === 'pending'
      ).length;
      const confirmedTourBookings = tourBookingsData.filter(b => 
        b.status === 'confirmed'
      ).length;
      const completedTourBookings = tourBookingsData.filter(b => 
        b.status === 'completed'
      ).length;
      const totalTourRevenue = tourBookingsData.reduce((sum, booking) => 
        sum + (parseFloat(booking.totalPrice) || 0), 0
      );
      
      // Get recent tour package bookings (last 5)
      const recentTourPackageBookings = tourBookingsData
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      
      setStats(prevStats => ({
        ...prevStats,
        totalTourPackages,
        tourPackageBookings: {
          totalBookings: totalTourBookings,
          totalRevenue: totalTourRevenue,
          pendingBookings: pendingTourBookings,
          confirmedBookings: confirmedTourBookings,
          completedBookings: completedTourBookings
        }
      }));
      
      setRecentTourPackageBookings(recentTourPackageBookings);
      
      console.log('Tour packages stats updated:', {
        totalPackages: totalTourPackages,
        totalBookings: totalTourBookings,
        revenue: totalTourRevenue
      });
      
    } catch (error) {
      console.error('Error fetching tour packages data:', error);
    } finally {
      setTourPackagesLoading(false);
    }
  };

  // Change tab function that updates URL
  const changeTab = (tabName) => {
    navigate(`/admin/dashboard?tab=${tabName}`);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200',
      rejected: 'bg-gray-100 text-gray-800 border border-gray-200'
    };

    const displayStatus = status || 'pending';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[displayStatus] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  // Refresh all data
  const refreshAllData = () => {
    fetchDashboardData();
    fetchActivitiesData();
    fetchTourPackagesData();
  };

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 mb-6 flex justify-between items-center bg-gradient-to-r from-white to-blue-50 p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, Admin</p>
        </div>
        <div className="text-sm bg-white py-2 px-3 rounded-md shadow-sm border border-gray-100 text-gray-600">
          <i className="far fa-calendar-alt mr-2"></i>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => changeTab('dashboard')}
            className={`${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard Overview
          </button>
          <button
            onClick={() => changeTab('contacts')}
            className={`${
              activeTab === 'contacts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
          >
            <i className="fas fa-envelope mr-2"></i>
            Contact Inquiries
            {stats.unreadContacts > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {stats.unreadContacts} unread
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button 
                  onClick={() => setError('')}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {(loading || activitiesLoading || tourPackagesLoading) ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* Tour Packages Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <i className="fas fa-route text-purple-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-purple-50 py-1 px-2 rounded-md">Tour Packages</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tour Packages</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-purple-600">{stats.totalTourPackages}</dd>
                    </dl>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Bookings: <span className="font-semibold">{stats.tourPackageBookings.totalBookings}</span>
                      </span>
                    </div>
                    <div className="mt-5">
                      <Link to="/admin/tour-packages" className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center">
                        Manage tour packages 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Tour Package Bookings Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-teal-100 p-3 rounded-full">
                        <i className="fas fa-suitcase-rolling text-teal-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-teal-50 py-1 px-2 rounded-md">Tour Bookings</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tour Package Bookings</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-teal-600">{stats.tourPackageBookings.totalBookings}</dd>
                    </dl>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Revenue: <span className="font-semibold">Rs {(Number(stats.tourPackageBookings.totalRevenue) || 0).toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="mt-5">
                      <Link to="/admin/tour-package-bookings" className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center">
                        View bookings 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Activities Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <i className="fas fa-hiking text-blue-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-blue-50 py-1 px-2 rounded-md">Excursions</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Excursions</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-blue-600">
                        {activitiesBreakdown.total}
                      </dd>
                    </dl>
                    <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        {activitiesBreakdown.active} active
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                        {activitiesBreakdown.featured} featured
                      </span>
                    </div>
                    <div className="mt-5">
                      <Link to="/admin/activities" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                        View all excursions 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Bookings Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <i className="fas fa-calendar-check text-green-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-green-50 py-1 px-2 rounded-md">Excursion Bookings</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Excursion Bookings</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-green-600">{stats.totalBookings}</dd>
                    </dl>
                    <div className="mt-5">
                      <Link to="/admin/bookings" className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center">
                        Manage Excursion bookings 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Users Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-indigo-100 p-3 rounded-full">
                        <i className="fas fa-users text-indigo-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-indigo-50 py-1 px-2 rounded-md">Users</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-indigo-600">{stats.totalUsers}</dd>
                    </dl>
                    <div className="mt-5">
                      <Link to="/admin/users" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                        View users 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Pending Bookings Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <i className="fas fa-clock text-yellow-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-yellow-50 py-1 px-2 rounded-md">Pending</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Bookings</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-yellow-600">{stats.pendingBookings}</dd>
                    </dl>
                    <div className="mt-5">
                      <Link to="/admin/bookings?status=pending" className="text-sm text-yellow-600 hover:text-yellow-800 font-medium flex items-center">
                        Review pending 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Contacts Card */}
                <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg border border-gray-50">
                  <div className="px-5 py-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-pink-100 p-3 rounded-full">
                        <i className="fas fa-envelope text-pink-600 text-xl"></i>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-pink-50 py-1 px-2 rounded-md">Contacts</span>
                    </div>
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Contact Inquiries</dt>
                      <dd className="mt-2 text-3xl font-extrabold text-pink-600">{stats.totalContacts}</dd>
                    </dl>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Unread: <span className="font-semibold">{stats.unreadContacts}</span>
                      </span>
                    </div>
                    <div className="mt-5">
                      <button
                        onClick={() => changeTab('contacts')}
                        className="text-sm text-pink-600 hover:text-pink-800 font-medium flex items-center cursor-pointer"
                      >
                        View inquiries 
                        <svg className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Tour Package Bookings */}
              <div className="bg-white shadow-md rounded-lg mb-8 border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-white to-teal-50">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tour Package Bookings</h3>
                    <p className="text-sm text-gray-500 mt-1">Latest tour package bookings</p>
                  </div>
                  <Link to="/admin/tour-package-bookings" className="text-sm bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center">
                    View all 
                    <i className="fas fa-arrow-right ml-2"></i>
                  </Link>
                </div>
                
                {recentTourPackageBookings && recentTourPackageBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Booking ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Tour Package
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date / Guests
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentTourPackageBookings.map((booking) => (
                          <tr key={booking._id} className="hover:bg-teal-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">
                              <Link to={`/admin/tour-package-bookings/${booking._id}`} className="hover:underline">
                                {booking.bookingReference || booking._id}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.tourPackage?.title || 'Unknown Tour'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {booking.user?.name || booking.fullName || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.user?.email || booking.email || ''}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{formatDate(booking.startDate)}</div>
                              <div className="text-xs text-gray-500">{booking.guests || 0} guests</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">Rs {booking.totalPrice || 0}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                      <i className="fas fa-suitcase-rolling text-teal-500 text-xl"></i>
                    </div>
                    <p className="text-gray-500 font-medium">No recent tour package bookings found.</p>
                    <p className="text-gray-400 text-sm mt-1">New tour package bookings will appear here when created.</p>
                  </div>
                )}
              </div>

              {/* Recent Bookings */}
              <div className="bg-white shadow-md rounded-lg mb-8 border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-white to-blue-50">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Excursions Bookings</h3>
                    <p className="text-sm text-gray-500 mt-1">Latest excursions bookings on your platform</p>
                  </div>
                  <Link to="/admin/bookings" className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center">
                    View all 
                    <i className="fas fa-arrow-right ml-2"></i>
                  </Link>
                </div>
                {recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Booking ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Excursion
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentBookings.map((booking) => (
                          <tr key={booking._id} className="hover:bg-blue-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              <Link to={`/admin/bookings/${booking._id}`} className="hover:underline">{booking.bookingReference}</Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{booking.activity ? booking.activity.title : 'Unknown Activity'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{booking.fullName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{formatDate(booking.date)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">Rs {booking.totalPrice}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <i className="fas fa-calendar-day text-blue-500 text-xl"></i>
                    </div>
                    <p className="text-gray-500 font-medium">No recent excursion bookings found.</p>
                    <p className="text-gray-400 text-sm mt-1">New bookings will appear here when created.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow-md rounded-lg border border-gray-100 mb-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
                  <p className="text-sm text-gray-500 mt-1">Shortcuts to common tasks</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link 
                      to="/admin/activities/new"
                      className="group bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center"
                    >
                      <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fas fa-plus-circle text-2xl"></i>
                      </div>
                      <h4 className="text-gray-900 font-semibold mb-2">Add New Excursion</h4>
                      <p className="text-gray-500 text-sm">Create a new excursion listing for your customers</p>
                    </Link>
                    
                    <Link 
                      to="/admin/bookings?status=pending"
                      className="group bg-gradient-to-br from-yellow-50 to-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center"
                    >
                      <div className="bg-yellow-100 text-yellow-600 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fas fa-clipboard-check text-2xl"></i>
                      </div>
                      <h4 className="text-gray-900 font-semibold mb-2">Pending Bookings</h4>
                      <p className="text-gray-500 text-sm">Review and approve booking requests from customers</p>
                    </Link>
                    
                    <div 
                      onClick={() => changeTab('contacts')}
                      className="group bg-gradient-to-br from-purple-50 to-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer"
                    >
                      <div className="bg-purple-100 text-purple-600 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fas fa-envelope text-2xl"></i>
                      </div>
                      <h4 className="text-gray-900 font-semibold mb-2">Contact Inquiries</h4>
                      <p className="text-gray-500 text-sm">View and manage customer contact inquiries</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={refreshAllData}
                  className="inline-flex items-center px-5 py-2.5 border border-blue-300 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Dashboard Data
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Contact Inquiries Tab */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-purple-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Contact Inquiries Management</h2>
                <p className="text-gray-600 text-sm mt-1">View and manage customer inquiries and messages</p>
              </div>
              <div className="text-sm bg-purple-100 text-purple-700 py-2 px-3 rounded-md font-medium">
                <i className="fas fa-headset mr-2"></i>
                Customer Support
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-info-circle text-blue-500 text-lg"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    This section allows you to view and manage all contact inquiries from your customers. 
                    You can reply to inquiries, update their status, and track communication history.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Contact Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalContacts}</div>
                <div className="text-sm text-gray-600">Total Inquiries</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.unreadContacts}</div>
                <div className="text-sm text-gray-600">Unread Messages</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{stats.totalContacts - stats.unreadContacts}</div>
                <div className="text-sm text-gray-600">Read Messages</div>
              </div>
            </div>
            
            <AdminContacts />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;