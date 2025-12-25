import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { tourPackageBookingsAPI } from '../../utils/api';
import { getCurrencySymbol, formatPrice } from '../../utils/currency'; // Import currency utilities

const TourPackageBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('all'); // NEW: Currency filter
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    // Get status from URL parameter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setSelectedStatus(statusParam);
    }
    
    fetchBookings();
  }, [searchParams]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching tour package bookings...');
      const response = await tourPackageBookingsAPI.getAll();
      
      if (response.data.success) {
        console.log('Bookings fetched:', response.data.data);
        // Sort bookings by date (newest first)
        const sortedBookings = response.data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBookings(sortedBookings);
        setCurrentPage(1);
      } else {
        setError('Failed to fetch bookings: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get display price based on booking currency
  const getDisplayPrice = (booking) => {
    if (!booking) return 0;
    
    const bookingCurrency = booking.currency || 'MUR';
    
    if (bookingCurrency === 'EUR') {
      return booking.totalPriceEur || booking.totalPrice || 0;
    } else {
      return booking.totalPriceMur || booking.totalPrice || 0;
    }
  };

  // Format price with proper currency symbol
  const formatBookingPrice = (booking) => {
    const price = getDisplayPrice(booking);
    const bookingCurrency = booking.currency || 'MUR';
    
    return formatPrice(price, bookingCurrency);
  };

  // Filter bookings based on search, status filter, date filter, and currency filter
  const filteredBookings = bookings.filter(booking => {
    // First filter by search term
    const matchesSearch = 
      (booking.tourPackage?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.bookingReference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then filter by status
    const matchesStatus = 
      selectedStatus === 'all' || (booking.status || '').toLowerCase() === selectedStatus.toLowerCase();
    
    // Then filter by currency
    const matchesCurrency = 
      selectedCurrency === 'all' || 
      (booking.currency || 'MUR').toUpperCase() === selectedCurrency.toUpperCase();
    
    // Then filter by date
    let matchesDate = true;
    
    if (selectedDateFilter !== 'all' && booking.startDate) {
      const bookingDate = new Date(booking.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeekStart = new Date(today);
      nextWeekStart.setDate(today.getDate() + 7);
      
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
      
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      switch (selectedDateFilter) {
        case 'today':
          matchesDate = bookingDate.setHours(0, 0, 0, 0) === today.getTime();
          break;
        case 'tomorrow':
          matchesDate = bookingDate.setHours(0, 0, 0, 0) === tomorrow.getTime();
          break;
        case 'thisWeek':
          matchesDate = 
            bookingDate >= today && 
            bookingDate < nextWeekStart;
          break;
        case 'nextWeek':
          matchesDate = 
            bookingDate >= nextWeekStart && 
            bookingDate < nextWeekEnd;
          break;
        case 'thisMonth':
          matchesDate = 
            bookingDate >= today && 
            bookingDate <= thisMonthEnd;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCurrency && matchesDate;
  });
  
  // Calculate pagination data
  useEffect(() => {
    setTotalPages(Math.ceil(filteredBookings.length / itemsPerPage));
    if (currentPage > Math.ceil(filteredBookings.length / itemsPerPage) && Math.ceil(filteredBookings.length / itemsPerPage) > 0) {
      setCurrentPage(1);
    }
  }, [filteredBookings, itemsPerPage]);

  // Get current page bookings
  const getCurrentPageBookings = () => {
    const indexOfLastBooking = currentPage * itemsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
    return filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle booking status change
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      // First, get the current booking to include all required fields
      const booking = bookings.find(b => b._id === bookingId);
    
      if (!booking) {
        setError('Booking not found');
        return;
      }
    
      // Create update payload with all required fields
      const updatePayload = {
        status: newStatus,
        startDate: booking.startDate,
        tourPackage: booking.tourPackage?._id || booking.tourPackage,
        guests: booking.guests,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone
      };
    
      const response = await tourPackageBookingsAPI.updateStatus(bookingId, newStatus);
    
      if (response.data.success) {
        setBookings(
          bookings.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: newStatus } 
              : booking
          )
        );
      } else {
        setError('Failed to update booking status: ' + (response.data.message || ''));
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Failed to update booking status. Please try again.');
    }
  };

  // Navigate to booking detail page
  const navigateToBookingDetail = (bookingId) => {
    navigate(`/admin/tour-package-bookings/${bookingId}`);
  };

  // Handle row click
  const handleRowClick = (bookingId, e) => {
    if (
      e.target.tagName === 'BUTTON' || 
      e.target.tagName === 'A' ||
      e.target.closest('button') ||
      e.target.closest('a')
    ) {
      return;
    }
    navigateToBookingDetail(bookingId);
  };

  // Get currency badge
  const getCurrencyBadge = (booking) => {
    const bookingCurrency = booking.currency || 'MUR';
    const styles = {
      MUR: 'bg-green-100 text-green-800 border border-green-200',
      EUR: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ml-1 ${styles[bookingCurrency] || styles.MUR}`}>
        {bookingCurrency === 'MUR' ? 'Rs' : '€'}
      </span>
    );
  };

  // Count bookings by currency
  const getCurrencyCounts = () => {
    return {
      all: bookings.length,
      MUR: bookings.filter(b => (b.currency || 'MUR') === 'MUR').length,
      EUR: bookings.filter(b => (b.currency || 'MUR') === 'EUR').length
    };
  };

  const currencyCounts = getCurrencyCounts();

  // Pagination component
  const Pagination = () => {
    const pageNumbers = [];
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (endPage - startPage < 4 && totalPages > 4) {
      if (currentPage < 3) {
        endPage = Math.min(5, totalPages);
      } else if (currentPage > totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredBookings.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of{' '}
              <span className="font-medium">{filteredBookings.length}</span> bookings
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              {/* Previous button */}
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* First page if not in view */}
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => paginate(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                </>
              )}
              
              {/* Page numbers */}
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`relative inline-flex items-center px-4 py-2 border ${currentPage === number ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
                >
                  {number}
                </button>
              ))}
              
              {/* Last page if not in view */}
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => paginate(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              {/* Next button */}
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Tour Package Bookings</h1>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
            <div className="col-span-1 md:col-span-4">
              <label htmlFor="search" className="sr-only">Search Bookings</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2.5 text-base border-gray-300 rounded-lg h-12"
                  placeholder="Search by booking ID, tour package or customer name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
              <select
                id="statusFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status ({bookings.length})</option>
                <option value="pending">Pending ({bookings.filter(b => b.status === 'pending').length})</option>
                <option value="confirmed">Confirmed ({bookings.filter(b => b.status === 'confirmed').length})</option>
                <option value="cancelled">Cancelled ({bookings.filter(b => b.status === 'cancelled').length})</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="currencyFilter" className="sr-only">Filter by Currency</label>
              <select
                id="currencyFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="all">All Currencies ({currencyCounts.all})</option>
                <option value="MUR">Rupees (Rs) ({currencyCounts.MUR})</option>
                <option value="EUR">Euros (€) ({currencyCounts.EUR})</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="dateFilter" className="sr-only">Filter by Date</label>
              <select
                id="dateFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="thisWeek">This Week</option>
                <option value="nextWeek">Next Week</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
              <i className="fas fa-receipt text-blue-600 text-lg"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
              <i className="fas fa-rupee-sign text-green-600 text-lg"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rupee Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{currencyCounts.MUR}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
              <i className="fas fa-euro-sign text-yellow-600 text-lg"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Euro Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{currencyCounts.EUR}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg">
              <i className="fas fa-filter text-purple-600 text-lg"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Showing</p>
              <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour Package
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount & Currency
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPageBookings().length > 0 ? (
                  getCurrentPageBookings().map((booking, index) => {
                    const displayPrice = formatBookingPrice(booking);
                    const bookingCurrency = booking.currency || 'MUR';
                    
                    return (
                      <tr 
                        key={booking._id} 
                        className={`hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        onClick={(e) => handleRowClick(booking._id, e)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          <Link to={`/admin/tour-package-bookings/${booking._id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                            {booking.bookingReference || `TP${booking._id.substring(0, 8)}`}
                          </Link>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.tourPackage?.title || 'Unknown Package'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{booking.fullName || booking.user?.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{booking.email || booking.user?.email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(booking.startDate)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 text-center">{booking.guests || 1}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {displayPrice}
                            </div>
                            {getCurrencyBadge(booking)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                              (booking.status || '').toLowerCase() === 'confirmed' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : (booking.status || '').toLowerCase() === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : (booking.status || '').toLowerCase() === 'cancelled'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                (booking.status || '').toLowerCase() === 'confirmed' ? 'bg-green-600' : 
                                (booking.status || '').toLowerCase() === 'pending' ? 'bg-yellow-600' : 
                                (booking.status || '').toLowerCase() === 'cancelled' ? 'bg-red-600' : 'bg-gray-600'
                              }`}></span>
                              {(booking.status || 'Unknown').charAt(0).toUpperCase() + (booking.status || 'Unknown').slice(1)}
                            </span>
                            {bookingCurrency === 'EUR' && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <i className="fas fa-euro-sign mr-0.5"></i>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {(booking.status || '').toLowerCase() === 'pending' && (
                            <div className="flex justify-end space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(booking._id, 'confirmed');
                                }}
                                className="inline-flex items-center px-2 py-1 rounded text-xs text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                              >
                                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Confirm
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(booking._id, 'cancelled');
                                }}
                                className="inline-flex items-center px-2 py-1 rounded text-xs text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          )}
                          {(booking.status || '').toLowerCase() === 'confirmed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(booking._id, 'cancelled');
                              }}
                              className="inline-flex items-center px-2 py-1 rounded text-xs text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          )}
                          {(booking.status || '').toLowerCase() === 'cancelled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(booking._id, 'confirmed');
                              }}
                              className="inline-flex items-center px-2 py-1 rounded text-xs text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500 mb-2">No tour package bookings found</p>
                        <p className="text-sm text-gray-400">
                          {searchTerm || selectedStatus !== 'all' || selectedCurrency !== 'all' || selectedDateFilter !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'No bookings have been made yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredBookings.length > 0 && <Pagination />}
          
          {/* Refresh Button */}
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-3 text-xs text-gray-500">Items per page:</span>
              <select
                className="border-gray-300 text-gray-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button
              onClick={fetchBookings}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 -ml-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Bookings
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TourPackageBookingsList;