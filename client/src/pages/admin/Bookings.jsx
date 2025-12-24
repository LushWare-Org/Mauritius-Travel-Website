import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { bookingsAPI, airportTransferBookingAPI } from '../../utils/api';
import { formatBookingPrice } from '../../utils/currency'; // Import the currency formatting function

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [airportTransferBookings, setAirportTransferBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    })),
  ];

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setSelectedStatus(statusParam);
    fetchBookings();
  }, [searchParams]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingsResponse, airportBookingsResponse] = await Promise.all([
        bookingsAPI.getAll(),
        airportTransferBookingAPI.getAllBookings(),
      ]);

      if (bookingsResponse.data.success) {
        // Sort bookings by creation date in descending order (most recent first)
        const sortedBookings = bookingsResponse.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBookings(sortedBookings);
        console.log('Bookings sorted by creation date (most recent first)');
      } else {
        setError('Failed to fetch activity bookings');
      }

      if (airportBookingsResponse.data.success) {
        // Sort airport transfers by creation date in descending order
        const sortedAirportBookings = airportBookingsResponse.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setAirportTransferBookings(sortedAirportBookings);
      } else {
        // Only set error if both requests fail
        if (!bookingsResponse.data.success) {
          setError('Failed to fetch airport transfer bookings');
        }
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findAirportTransferForBooking = (bookingReference) => {
    return airportTransferBookings.find((transfer) =>
      transfer.specialRequests?.includes(bookingReference)
    );
  };

  const getTotalPriceWithTransfer = (booking) => {
    const airportTransfer = findAirportTransferForBooking(booking.bookingReference);
    let total = parseFloat(booking.totalPrice || 0);
    if (airportTransfer) {
      total += parseFloat(airportTransfer.totalPrice || airportTransfer.price || 0);
    }
    return total;
  };

  const getAirportTransferPrice = (booking) => {
    const airportTransfer = findAirportTransferForBooking(booking.bookingReference);
    return airportTransfer ? parseFloat(airportTransfer.totalPrice || airportTransfer.price || 0) : 0;
  };

  const hasAirportTransfer = (booking) => {
    return !!findAirportTransferForBooking(booking.bookingReference);
  };

  const getFilteredBookings = () => {
    return bookings.filter((booking) => {
      // Convert search term and fields to lowercase safely
      const searchTermLower = searchTerm.toLowerCase();
      const activityTitle = (booking.activity?.title || '').toLowerCase();
      const fullName = (booking.fullName || '').toLowerCase();
      const bookingReference = (booking.bookingReference || '').toLowerCase();
      const email = (booking.email || '').toLowerCase();

      const matchesSearch =
        activityTitle.includes(searchTermLower) ||
        fullName.includes(searchTermLower) ||
        bookingReference.includes(searchTermLower) ||
        email.includes(searchTermLower);

      const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;

      let matchesDate = true;
      if (booking.date) {
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (selectedDateFilter) {
          case 'today':
            const todayDate = new Date(today);
            matchesDate = bookingDate.setHours(0, 0, 0, 0) === todayDate.setHours(0, 0, 0, 0);
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            matchesDate = bookingDate.setHours(0, 0, 0, 0) === tomorrow.setHours(0, 0, 0, 0);
            break;
          case 'thisWeek':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + 7);
            matchesDate = bookingDate >= today && bookingDate < nextWeekStart;
            break;
          case 'nextWeek':
            const nextWeekEnd = new Date(today);
            nextWeekEnd.setDate(today.getDate() + 14);
            const weekStart = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            matchesDate = bookingDate >= weekStart && bookingDate < nextWeekEnd;
            break;
          case 'thisMonth':
            const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            thisMonthEnd.setHours(23, 59, 59, 999);
            matchesDate = bookingDate >= today && bookingDate <= thisMonthEnd;
            break;
          default:
            matchesDate = true;
        }
      }

      let matchesMonth = true;
      if (selectedMonth !== 'all' && booking.date) {
        const bookingDate = new Date(booking.date);
        const bookingMonth = (bookingDate.getMonth() + 1).toString().padStart(2, '0');
        matchesMonth = bookingMonth === selectedMonth;
      }

      let matchesYear = true;
      if (selectedYear !== 'all' && booking.date) {
        const bookingDate = new Date(booking.date);
        matchesYear = bookingDate.getFullYear() === parseInt(selectedYear, 10);
      }

      let matchesDateRange = true;
      if (booking.date) {
        const bookingDate = new Date(booking.date);
        
        if (dateRange.startDate && dateRange.endDate) {
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = bookingDate >= startDate && bookingDate <= endDate;
        } else if (dateRange.startDate && !dateRange.endDate) {
          const startDate = new Date(dateRange.startDate);
          matchesDateRange = bookingDate >= startDate;
        } else if (!dateRange.startDate && dateRange.endDate) {
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = bookingDate <= endDate;
        }
      }

      return matchesSearch && matchesStatus && matchesDate && matchesMonth && matchesYear && matchesDateRange;
    });
  };

  const filteredBookings = getFilteredBookings();

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    setTotalPages(newTotalPages);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredBookings, itemsPerPage, currentPage]);

  const getCurrentPageBookings = () => {
    const indexOfLastBooking = currentPage * itemsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
    return filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDurationTypeDisplay = (booking) => {
    if (booking.durationType) return booking.durationType;
    if (booking.duration === 'halfDay') return 'Half Day';
    if (booking.duration === 'fullDay') return 'Full Day';
    if (booking.activity?.pricingType === 'half-full-day') {
      if (booking.pricePerPerson && booking.activity) {
        if (booking.pricePerPerson === booking.activity.halfDayPrice) return 'Half Day';
        if (booking.pricePerPerson === booking.activity.fullDayPrice) return 'Full Day';
      }
      return 'Half/Full Day';
    }
    return 'Standard';
  };

  const getAirportTransferDetails = (booking) => {
    const transfer = findAirportTransferForBooking(booking.bookingReference);
    if (!transfer) return null;

    return {
      hasTransfer: true,
      status: transfer.status,
      type: transfer.transferType === 'airport-to-hotel' ? 'Airport → Hotel' : 'Hotel → Airport',
      tripType: transfer.tripType === 'round-trip' ? 'Round Trip' : 'One Way',
      price: transfer.totalPrice || transfer.price || 0,
      pickupDate: transfer.pickupDate,
      pickupTime: transfer.pickupTime,
      flightNumber: transfer.flightNumber,
      passengers: transfer.passengers,
      pickupLocation: transfer.pickupLocation,
      dropoffLocation: transfer.dropoffLocation,
    };
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(status)}`}>
        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
          status === 'confirmed' ? 'bg-blue-600' :
          status === 'completed' ? 'bg-green-600' :
          status === 'pending' ? 'bg-yellow-600' :
          status === 'cancelled' ? 'bg-red-600' :
          'bg-gray-600'
        }`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await bookingsAPI.updateStatus(bookingId, newStatus);
      if (response.data.success) {
        setBookings(bookings.map((booking) =>
          booking._id === bookingId ? { ...booking, status: newStatus } : booking
        ));
      } else {
        setError('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Failed to update booking status. Please try again.');
    }
  };

  const navigateToBookingDetail = (bookingId) => {
    navigate(`/admin/bookings/${bookingId}`);
  };

  const handleRowClick = (bookingId, e) => {
    if (e.target.tagName === 'BUTTON' || 
        e.target.tagName === 'A' || 
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'INPUT' ||
        e.target.closest('button') || 
        e.target.closest('a') ||
        e.target.closest('select') ||
        e.target.closest('input')) {
      return;
    }
    navigateToBookingDetail(bookingId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedDateFilter('all');
    setSelectedMonth('all');
    setSelectedYear('all');
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const BookingStats = () => {
    const totalBookings = filteredBookings.length;
    const bookingsWithTransfer = filteredBookings.filter((booking) => hasAirportTransfer(booking)).length;
    const confirmedBookings = filteredBookings.filter((b) => b.status === 'confirmed').length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { 
            label: 'Filtered Bookings', 
            value: totalBookings, 
            desc: `${bookings.length > 0 ? `${((totalBookings / bookings.length) * 100).toFixed(1)}% of total` : '0%'}`, 
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
          },
          { 
            label: 'Confirmed', 
            value: confirmedBookings, 
            desc: `${totalBookings > 0 ? `${((confirmedBookings / totalBookings) * 100).toFixed(1)}% confirmed` : '0%'}`, 
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
          },
          { 
            label: 'With Transfer', 
            value: bookingsWithTransfer, 
            desc: `${totalBookings > 0 ? `${((bookingsWithTransfer / totalBookings) * 100).toFixed(1)}%` : '0%'}`, 
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
              Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredBookings.length)}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of{' '}
              <span className="font-medium">{filteredBookings.length}</span> bookings
            </p>
          </div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button 
              onClick={prevPage} 
              disabled={currentPage === 1} 
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {startPage > 1 && (
              <>
                <button 
                  onClick={() => paginate(1)} 
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  1
                </button>
                {startPage > 2 && <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>}
              </>
            )}
            {pageNumbers.map((number) => (
              <button 
                key={number} 
                onClick={() => paginate(number)} 
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === number 
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {number}
              </button>
            ))}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>}
                <button 
                  onClick={() => paginate(totalPages)} 
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button 
              onClick={nextPage} 
              disabled={currentPage === totalPages} 
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Excursions Bookings</h1>
            <p className="text-gray-600 mt-1">View and manage all activity bookings including airport transfers</p>
          </div>
        </div>
      </div>

      <BookingStats />

      <div className="bg-white shadow rounded-lg mb-6 border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-7 mb-4">
            <div className="col-span-1 md:col-span-3">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by booking ID, activity, customer name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <select
              className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="mr-2 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
            </div>
          </div>
          {filteredBookings.length !== bookings.length && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <svg className="flex-shrink-0 mr-2 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Showing {filteredBookings.length} of {bookings.length} bookings
              {selectedStatus !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Status: {selectedStatus}</span>
              )}
              {selectedMonth !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Month: {months.find((m) => m.value === selectedMonth)?.label}
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Year: {selectedYear}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setError('')}
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity & Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPageBookings().length > 0 ? (
                  getCurrentPageBookings().map((booking, index) => {
                    const durationType = getDurationTypeDisplay(booking);
                    const transferDetails = getAirportTransferDetails(booking);
                    const totalWithTransfer = getTotalPriceWithTransfer(booking);
                    const transferPrice = getAirportTransferPrice(booking);
                    const hasTransfer = hasAirportTransfer(booking);
                    const isPending = booking.status === 'pending';

                    return (
                      <tr
                        key={booking._id}
                        className={`transition-colors duration-150 cursor-pointer ${
                          isPending
                            ? 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-400'
                            : index % 2 === 0
                            ? 'bg-white hover:bg-blue-50'
                            : 'bg-gray-50 hover:bg-blue-50'
                        }`}
                        onClick={(e) => handleRowClick(booking._id, e)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            <Link
                              to={`/admin/bookings/${booking._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {booking.bookingReference}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {booking.paymentStatus && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${
                                  booking.paymentStatus === 'paid'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {booking.paymentStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.activity?.title || 'Unknown Activity'}
                          </div>
                          <div className="text-sm text-gray-900 mt-1">{booking.fullName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {booking.email}
                          </div>
                          <div className="text-xs text-gray-500">{booking.phone || 'No phone'}</div>
                          {booking.specialRequests && (
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Notes:</span>{' '}
                              {booking.specialRequests.substring(0, 50)}
                              {booking.specialRequests.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                          {durationType !== 'Standard' && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-blue-50 text-blue-800 border-blue-200">
                                {durationType}
                              </span>
                            </div>
                          )}
                          {hasTransfer && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Airport Transfer
                              </span>
                              {transferDetails?.pickupDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {transferDetails.pickupTime
                                    ? `${transferDetails.pickupTime} on `
                                    : ''}
                                  {formatDate(transferDetails.pickupDate)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatBookingPrice(totalWithTransfer, booking)} {/* Use formatBookingPrice */}
                              {hasTransfer && (
                                <span className="text-xs text-blue-600 ml-1">(incl. transfer)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>Excursion: {formatBookingPrice(booking.totalPrice, booking)}</div> {/* Use formatBookingPrice */}
                              {hasTransfer && (
                                <div className="text-blue-600">
                                  Transfer: +{formatBookingPrice(transferPrice, booking)} {/* Use formatBookingPrice */}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                          {hasTransfer && transferDetails?.status && (
                            <div className="mt-1">
                              <StatusBadge status={transferDetails.status} />
                              <div className="text-xs text-gray-500 mt-1">
                                {transferDetails.type}
                                {transferDetails.tripType === 'Round Trip'
                                  ? ' (Round Trip)'
                                  : ' (One Way)'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/admin/bookings/${booking._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                           
                            {booking.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(booking._id, 'cancelled');
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                            {booking.status === 'cancelled' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(booking._id, 'confirmed');
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
                      No bookings found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredBookings.length > 0 && <Pagination />}
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-3 text-xs text-gray-500">Items per page:</span>
              <select
                className="border border-gray-300 text-gray-700 text-sm rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              type="button"
              onClick={fetchBookings}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="mr-2 -ml-1 h-4 w-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh Bookings
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBookings;