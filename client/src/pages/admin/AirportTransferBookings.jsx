import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { airportTransferBookingAPI } from '../../utils/airportTransferApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatBookingPrice } from '../../utils/currency'; 
import { jsPDF } from 'jspdf';
import logo from '../../assets/logo.png';

const AirportTransferBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    adminNotes: '',
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showLinkedTransfers, setShowLinkedTransfers] = useState(false);

  // Load logo as base64
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          localStorage.setItem('company_logo', reader.result);
          setImageLoaded(true);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error loading logo:', error);
        setImageLoaded(true);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [statusFilter, showLinkedTransfers]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = statusFilter === 'all' ? {} : { status: statusFilter };
      const response = await airportTransferBookingAPI.getAllBookings(params);

      if (response.data.success) {
        setAllBookings(response.data.data);
        
        const filteredBookings = response.data.data.filter(booking => {
          if (showLinkedTransfers) {
            return true;
          }
          
          if (booking.specialRequests) {
            const specialRequests = booking.specialRequests.toLowerCase();
            
            if (
              specialRequests.includes('booking ref:') ||
              specialRequests.includes('booking reference:') ||
              specialRequests.includes('activity booking:') ||
              specialRequests.includes('activity ref:') ||
              specialRequests.includes('linked to') ||
              specialRequests.includes('combined with') ||
              specialRequests.match(/[a-z]{3}-[0-9]{6}/) ||
              specialRequests.match(/act-\d+/i) ||
              specialRequests.match(/booking\s*#?\s*[a-z0-9-]+/i)
            ) {
              return false;
            }
          }
          
          if (booking.activityBookingReference || booking.activityBookingId) {
            return false;
          }
          
          if (booking.bookingReference) {
            if (
              booking.bookingReference.startsWith('ACT-') || 
              booking.bookingReference.startsWith('AB-') ||
              booking.bookingReference.includes('-ACT-')
            ) {
              return false;
            }
          }
          
          if (booking.activityId || booking.linkedActivityId) {
            return false;
          }
          
          return true;
        });

        console.log('Filtered airport transfers:', {
          total: response.data.data.length,
          standalone: filteredBookings.length,
          linked: response.data.data.length - filteredBookings.length
        });

        setBookings(filteredBookings);
      } else {
        setError('Failed to load bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await airportTransferBookingAPI.getBookingStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusUpdate = async (bookingId) => {
    try {
      await airportTransferBookingAPI.updateBookingStatus(
        bookingId,
        statusUpdate.status,
        statusUpdate.adminNotes
      );

      setSelectedBooking(null);
      setStatusUpdate({ status: '', adminNotes: '' });
      fetchBookings();
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update booking status');
    }
  };

  const generatePDF = (booking) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add blue header background
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Try to add logo if available
    try {
      const logoBase64 = localStorage.getItem('company_logo');
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 10, 5, 30, 30);
      }
    } catch (error) {
      console.log('Could not add logo, continuing without it');
    }

    // Add company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Holiday Vibes Tour Ltd', pageWidth / 2, 20, { align: 'center' });

    // Add subheader
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Airport Transfer Services', pageWidth / 2, 30, {
      align: 'center',
    });

    // Add booking details title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING CONFIRMATION', pageWidth / 2, 50, { align: 'center' });

    // Add booking reference
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Booking Reference: ${booking.bookingReference}`,
      pageWidth / 2,
      60,
      { align: 'center' }
    );

    // Add line separator
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);

    // Customer Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', 20, 75);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${booking.guestName}`, 20, 85);
    doc.text(`Email: ${booking.email}`, 20, 92);
    doc.text(`Phone: ${booking.phone}`, 20, 99);

    // Transfer Details Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSFER DETAILS', 20, 115);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Airport: ${booking.transfer?.airportName || 'N/A'}`, 20, 125);
    doc.text(
      `Vehicle Type: ${booking.transfer?.vehicleType?.toUpperCase() || 'N/A'}`,
      20,
      132
    );
    doc.text(
      `Trip Type: ${
        booking.tripType?.replace('-', ' ').toUpperCase() || 'N/A'
      }`,
      20,
      139
    );
    doc.text(`Date: ${formatDate(booking.arrivalDate)}`, 20, 146);
    doc.text(`Passengers: ${booking.passengers || 1}`, 20, 153);

    // Payment Details Section - UPDATED
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 20, 170);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Use formatBookingPrice instead of hardcoded RS
    doc.text(`Total Amount: ${formatBookingPrice(booking.totalPrice, booking)}`, 20, 180);
    doc.text(
      `Status: ${booking.status?.toUpperCase() || 'COMPLETED'}`,
      20,
      187
    );
    doc.text(`Payment Date: ${formatDate(new Date())}`, 20, 194);

    // Add special notes section
    if (booking.specialRequests || booking.adminNotes) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL NOTES', 20, 210);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const notes = booking.specialRequests || booking.adminNotes || '';
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
      doc.text(splitNotes, 20, 220);
    }

    // Add footer with company info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    // Add footer border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);

    // Company contact info
    doc.text('Holiday Vibes Tour Ltd', pageWidth / 2, pageHeight - 25, {
      align: 'center',
    });
    doc.text(
      'Airport Transfer Services | www.holidayvibestour.com',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
    doc.text(
      'Email: info@holidayvibestour.com | Phone: +960 123 4567',
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
    doc.text(
      'Thank you for choosing our services!',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Save the PDF
    doc.save(`booking-${booking.bookingReference}.pdf`);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      rejected: 'bg-gray-100 text-gray-800 border border-gray-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || ''
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleToggleLinkedTransfers = () => {
    setShowLinkedTransfers(!showLinkedTransfers);
  };

  // Calculate filtered stats with proper currency formatting
  const filteredStats = {
    totalBookings: [{ count: bookings.length }],
    byStatus: bookings.reduce((acc, booking) => {
      const existing = acc.find(item => item._id === booking.status);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ _id: booking.status, count: 1 });
      }
      return acc;
    }, []),
    totalRevenue: [{ total: bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0) }]
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Airport Transfer Bookings
              </h1>
              <p className="text-gray-600">
                Manage and monitor airport transfer bookings
              </p>
            </div>
            
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">
                Show linked transfers
              </span>
              <button
                onClick={handleToggleLinkedTransfers}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  showLinkedTransfers ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    showLinkedTransfers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Information about filtered results */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showLinkedTransfers ? (
                  <span>Showing ALL airport transfers (including those linked to activities) - {bookings.length} bookings</span>
                ) : (
                  <span>Showing only standalone airport transfers (excluding those linked to activities) - {bookings.length} bookings</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {filteredStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <i className="fas fa-calendar-alt text-blue-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredStats.totalBookings?.[0]?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <i className="fas fa-check-circle text-green-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredStats.byStatus?.find((s) => s._id === 'confirmed')
                        ?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <i className="fas fa-clock text-yellow-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredStats.byStatus?.find((s) => s._id === 'pending')
                        ?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <i className="fas fa-money-bill text-purple-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {/* Calculate total revenue with proper currency formatting */}
                      {(() => {
                        // Calculate total revenue from all bookings
                        const totalRevenue = bookings.reduce((sum, booking) => {
                          return sum + (parseFloat(booking.totalPrice) || 0);
                        }, 0);
                        
                        // Get currency from first booking or default to MUR
                        const currency = bookings.length > 0 
                          ? bookings[0].currency || 'MUR' 
                          : 'MUR';
                          
                        // Format the total revenue based on currency
                        if (currency === 'EUR') {
                          return `€${totalRevenue.toFixed(2)}`;
                        } else {
                          return `Rs ${Math.round(totalRevenue)}`;
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md p-2"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed / Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button
                onClick={fetchBookings}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-calendar-times text-gray-300 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-500">
                  {statusFilter === 'all'
                    ? `No ${showLinkedTransfers ? 'airport transfer' : 'standalone airport transfer'} bookings yet.`
                    : 'No bookings match the selected filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Booking Ref
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Customer
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Transfer
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Trip Details
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Currency
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => {
                      const isLinked = 
                        (booking.specialRequests && 
                         (booking.specialRequests.includes('Booking Ref:') || 
                          booking.specialRequests.match(/[A-Z]{3}-[0-9]{6}/))) ||
                        booking.activityBookingReference ||
                        booking.activityBookingId ||
                        (booking.bookingReference && (
                          booking.bookingReference.startsWith('ACT-') || 
                          booking.bookingReference.startsWith('AB-') ||
                          booking.bookingReference.includes('-ACT-')
                        ));

                      return (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.bookingReference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {booking.guestName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {booking.transfer?.airportName}
                              </div>
                              <div className="text-gray-500 capitalize">
                                {booking.transfer?.vehicleType}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-900 capitalize">
                                {booking.tripType.replace('-', ' ')}
                              </div>
                              <div className="text-gray-500">
                                {formatDate(booking.arrivalDate)}
                              </div>
                              <div className="text-gray-500 text-xs">
                                Passengers: {booking.passengers}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* UPDATED: Use formatBookingPrice */}
                            {formatBookingPrice(booking.totalPrice, booking)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              booking.currency === 'EUR' 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}>
                              {booking.currency || 'MUR'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isLinked ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                <i className="fas fa-link mr-1 text-xs"></i>
                                Linked
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <i className="fas fa-plane mr-1 text-xs"></i>
                                Standalone
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Update Status"
                              >
                                <i className="fas fa-edit"></i>
                              </button>

                              {/* Show PDF button only for completed bookings */}
                              {booking.status === 'completed' && (
                                <button
                                  onClick={() => generatePDF(booking)}
                                  disabled={!imageLoaded}
                                  className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-900 disabled:opacity-50"
                                  title="Download Receipt PDF"
                                >
                                  <i className="fas fa-file-pdf text-lg"></i>
                                  <span className="text-sm font-medium">
                                    Invoice.PDF
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Update Booking Status
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Booking Reference: {selectedBooking.bookingReference}
                </p>
                <p className="text-sm text-gray-600">
                  Customer: {selectedBooking.guestName}
                </p>
                <p className="text-sm text-gray-600">
                  Amount: {formatBookingPrice(selectedBooking.totalPrice, selectedBooking)}
                </p>
                {/* Show transfer type in modal */}
                {(() => {
                  const isLinked = 
                    (selectedBooking.specialRequests && 
                     (selectedBooking.specialRequests.includes('Booking Ref:') || 
                      selectedBooking.specialRequests.match(/[A-Z]{3}-[0-9]{6}/))) ||
                    selectedBooking.activityBookingReference ||
                    selectedBooking.activityBookingId;
                  
                  return isLinked ? (
                    <p className="text-sm text-purple-600 mt-1">
                      <i className="fas fa-link mr-1"></i>
                      This transfer is linked to an activity
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600 mt-1">
                      <i className="fas fa-plane mr-1"></i>
                      Standalone transfer
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={statusUpdate.status}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        status: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed / Paid</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={statusUpdate.adminNotes}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        adminNotes: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Add notes about this status update..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking._id)}
                    disabled={!statusUpdate.status}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AirportTransferBookings;