import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import BookingStatusBadge from '../../components/dashboard/BookingStatusBadge';
import DashboardDebugger from '../../components/dashboard/DashboardDebugger';
import { userBookingsAPI, airportTransferBookingAPI } from '../../utils/api';
import { jsPDF } from 'jspdf';
import logo from '../../assets/logo.png';
import { getCurrencySymbol, formatPrice } from '../../utils/currency'; // Import the currency helper

const MyBookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [retryCount, setRetryCount] = useState(0);
  const [cancelNotification, setCancelNotification] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [selectedBookingForPDF, setSelectedBookingForPDF] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  // Function to get booking currency - with proper fallback
  const getBookingCurrency = (booking) => {
    // First priority: currency from booking
    if (booking.currency) {
      return booking.currency;
    }
    
    // Second priority: currency from airport transfer
    if (booking.airportTransfer?.currency) {
      return booking.airportTransfer.currency;
    }
    
    // Third priority: try to infer from activity or price
    if (booking.activity?.currency) {
      return booking.activity.currency;
    }
    
    // Default fallback: MUR
    return 'MUR';
  };

  // Function to format price for display with correct currency symbol
  const formatBookingPrice = (price, booking) => {
    if (!price) return formatPrice(0, getBookingCurrency(booking));
    const currency = getBookingCurrency(booking);
    return formatPrice(price, currency);
  };

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
  }, [currentUser, retryCount]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await userBookingsAPI.getUpcoming();

      if (response.data.success) {
        let bookingsWithTransfers = response.data.data;

        // DEBUG: Log the raw booking data
        console.log('Raw booking data:', bookingsWithTransfers.map(b => ({
          id: b._id,
          title: b.activity?.title,
          currency: b.currency,
          totalPrice: b.totalPrice,
          activityCurrency: b.activity?.currency
        })));

        if (currentUser?.email) {
          try {
            let airportTransfers = [];
            try {
              const userTransfersResponse =
                await airportTransferBookingAPI.getUserBookings();
              if (userTransfersResponse.data.success) {
                airportTransfers = userTransfersResponse.data.data;
              }
            } catch (userEndpointErr) {
              try {
                const allTransfersResponse =
                  await airportTransferBookingAPI.getAllBookings();
                if (allTransfersResponse.data.success) {
                  airportTransfers = allTransfersResponse.data.filter(
                    (transfer) => transfer.email === currentUser.email
                  );
                }
              } catch (allTransfersErr) {
                console.log(
                  'Cannot fetch all airport transfers:',
                  allTransfersErr.message
                );
              }
            }

            if (airportTransfers.length > 0) {
              bookingsWithTransfers = bookingsWithTransfers.map((booking) => {
                const linkedTransfer = airportTransfers.find(
                  (transfer) =>
                    (transfer.specialRequests &&
                      transfer.specialRequests.includes(
                        booking.bookingReference
                      )) ||
                    transfer.activityBookingReference ===
                      booking.bookingReference ||
                    transfer.activityBookingId === booking._id
                );

                if (linkedTransfer) {
                  return {
                    ...booking,
                    // Ensure currency is preserved
                    currency: booking.currency || linkedTransfer.currency || 'MUR',
                    airportTransfer: {
                      selected: true,
                      price:
                        linkedTransfer.totalPrice || linkedTransfer.price || 0,
                      type:
                        linkedTransfer.tripType === 'one-way'
                          ? 'One Way'
                          : linkedTransfer.tripType === 'round-trip'
                          ? 'Round Trip'
                          : linkedTransfer.tripType || 'Transfer',
                      details:
                        linkedTransfer.transferType === 'airport-to-hotel'
                          ? 'Airport to Hotel'
                          : linkedTransfer.transferType === 'hotel-to-airport'
                          ? 'Hotel to Airport'
                          : linkedTransfer.transferType || 'Airport Transfer',
                      bookingReference: linkedTransfer.bookingReference,
                      status: linkedTransfer.status,
                      transferType: linkedTransfer.transferType,
                      tripType: linkedTransfer.tripType,
                      airportName:
                        linkedTransfer.transfer?.airportName || 'N/A',
                      airportCode:
                        linkedTransfer.transfer?.airportCode || 'N/A',
                      vehicleType: linkedTransfer.transfer?.vehicleType,
                      guestName: linkedTransfer.guestName,
                      email: linkedTransfer.email,
                      phone: linkedTransfer.phone,
                      arrivalDate: linkedTransfer.arrivalDate,
                      arrivalTime: linkedTransfer.arrivalTime,
                      departureDate: linkedTransfer.departureDate,
                      departureTime: linkedTransfer.departureTime,
                      flightNumber: linkedTransfer.flightNumber,
                      specialRequests: linkedTransfer.specialRequests,
                      adminNotes: linkedTransfer.adminNotes,
                      currency: linkedTransfer.currency || booking.currency || 'MUR',
                    },
                  };
                }
                return {
                  ...booking,
                  currency: booking.currency || 'MUR'
                };
              });
            } else {
              // Add default currency to bookings without transfers
              bookingsWithTransfers = bookingsWithTransfers.map(booking => ({
                ...booking,
                currency: booking.currency || 'MUR',
              }));
            }
          } catch (transferErr) {
            console.log(
              'Error fetching airport transfers:',
              transferErr.message
            );
            // Still add default currency
            bookingsWithTransfers = bookingsWithTransfers.map(booking => ({
              ...booking,
              currency: booking.currency || 'MUR',
            }));
          }
        } else {
          // Add default currency for non-logged in users
          bookingsWithTransfers = bookingsWithTransfers.map(booking => ({
            ...booking,
            currency: booking.currency || 'MUR',
          }));
        }

        // DEBUG: Log after processing
        console.log('Processed bookings:', bookingsWithTransfers.map(b => ({
          id: b._id,
          title: b.activity?.title,
          currency: b.currency,
          totalPrice: b.totalPrice,
          hasTransfer: !!b.airportTransfer,
          transferCurrency: b.airportTransfer?.currency
        })));

        // Sort by creation date (newest first) initially
        const sortedBookings = [...bookingsWithTransfers].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setBookings(sortedBookings);
        setError('');
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRetryCount((prevCount) => prevCount + 1);
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
  };

  // Sort bookings based on selected sort order
  const sortedBookings = useMemo(() => {
    const filtered =
      activeTab === 'all'
        ? [...bookings]
        : bookings.filter((booking) => booking.status === activeTab);

    return filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
  }, [bookings, activeTab, sortOrder]);

  const bookingCounts = {
    all: bookings.length,
    pending: bookings.filter((booking) => booking.status === 'pending').length,
    confirmed: bookings.filter((booking) => booking.status === 'confirmed')
      .length,
    cancelled: bookings.filter((booking) => booking.status === 'cancelled')
      .length,
  };

  const handleCancelBooking = (booking) => {
    const bookingCurrency = getBookingCurrency(booking);
    
    setCancelNotification({
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      activityName: booking.activity?.title || 'Unknown Activity',
      date: booking.date,
      totalPrice: booking.totalPrice,
      currency: bookingCurrency,
    });

    setTimeout(() => {
      if (cancelNotification?.bookingId === booking._id) {
        setCancelNotification(null);
      }
    }, 10000);
  };

  const handleContactAdminForCancellation = () => {
    if (cancelNotification) {
      navigate('/contact', {
        state: {
          prefillMessage: `I would like to cancel my activity booking (Reference: ${
            cancelNotification.bookingReference
          }) for "${cancelNotification.activityName}" scheduled on ${formatDate(
            cancelNotification.date
          )}. Total amount: ${formatBookingPrice(cancelNotification.totalPrice, {currency: cancelNotification.currency})}. Please assist with the cancellation process and provide information about any applicable cancellation fees or refunds.`,
        },
      });
      setCancelNotification(null);
    }
  };

  const handleCloseNotification = () => {
    setCancelNotification(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateForPDF = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const calculateTotalPrice = (booking) => {
    let total = parseFloat(booking.totalPrice) || 0;

    if (booking.airportTransfer && booking.airportTransfer.price) {
      total += parseFloat(booking.airportTransfer.price);
    }

    return total;
  };

  // Function to get transfer type text
  const getTransferTypeText = (transferType) => {
    switch (transferType) {
      case 'airport-to-hotel':
        return 'Airport → Hotel';
      case 'hotel-to-airport':
        return 'Hotel → Airport';
      case 'both':
        return 'Both Directions';
      default:
        return 'N/A';
    }
  };

  // Extracted PDF generation function with improved styling
  const generateCombinedPDF = (booking) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add blue header background
    doc.setFillColor(59, 130, 246); // Blue-600
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
    doc.text('Booking Confirmation', pageWidth / 2, 30, {
      align: 'center',
    });

    // Add booking details title
    doc.setTextColor(0, 0, 0); // Black
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING INVOICE', pageWidth / 2, 50, { align: 'center' });

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
    doc.setDrawColor(59, 130, 246); // Blue-600
    doc.setLineWidth(0.5);
    doc.line(20, 65, pageWidth - 20, 65);

    // Customer Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', 20, 75);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${booking.fullName}`, 20, 85);
    doc.text(`Email: ${booking.email}`, 20, 92);
    doc.text(`Phone: ${booking.phone}`, 20, 99);

    // Activity Details Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVITY DETAILS', 20, 115);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Activity: ${booking.activity?.title || 'N/A'}`, 20, 125);
    doc.text(`Date: ${formatDateForPDF(booking.date)}`, 20, 132);
    doc.text(
      `Status: ${booking.status?.toUpperCase() || 'CONFIRMED'}`,
      20,
      139
    );
    doc.text(`Location: ${booking.activity?.location || 'N/A'}`, 20, 146);

    // Airport Transfer Section (if exists)
    let currentY = 165;
    if (booking.airportTransfer) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AIRPORT TRANSFER DETAILS', 20, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      if (booking.airportTransfer.airportName) {
        doc.text(
          `Airport: ${booking.airportTransfer.airportName} (${booking.airportTransfer.airportCode})`,
          20,
          currentY
        );
        currentY += 7;
      }
      
      doc.text(
        `Vehicle Type: ${booking.airportTransfer.vehicleType?.toUpperCase() || 'N/A'}`,
        20,
        currentY
      );
      currentY += 7;
      
      doc.text(
        `Trip Type: ${booking.airportTransfer.type?.toUpperCase() || 'N/A'}`,
        20,
        currentY
      );
      currentY += 7;
      
      doc.text(
        `Transfer Type: ${getTransferTypeText(booking.airportTransfer.transferType)}`,
        20,
        currentY
      );
      currentY += 7;
      
      if (booking.airportTransfer.arrivalDate) {
        doc.text(
          `Arrival: ${formatDate(booking.airportTransfer.arrivalDate)} ${booking.airportTransfer.arrivalTime || ''}`,
          20,
          currentY
        );
        currentY += 7;
      }
      
      if (booking.airportTransfer.departureDate) {
        doc.text(
          `Departure: ${formatDate(booking.airportTransfer.departureDate)} ${booking.airportTransfer.departureTime || ''}`,
          20,
          currentY
        );
        currentY += 7;
      }
      
      if (booking.airportTransfer.flightNumber) {
        doc.text(
          `Flight Number: ${booking.airportTransfer.flightNumber}`,
          20,
          currentY
        );
        currentY += 7;
      }
      
      currentY += 5;
    }

    // Payment Details Section
    const paymentY = booking.airportTransfer ? currentY + 5 : 180;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 20, paymentY);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const priceY = paymentY + 10;
    
    const bookingCurrency = getBookingCurrency(booking);
    const currencySymbol = getCurrencySymbol(bookingCurrency);
    
    doc.text(`Activity Amount: ${currencySymbol}${booking.totalPrice || 0}`, 20, priceY);
    
    if (booking.airportTransfer && booking.airportTransfer.price) {
      doc.text(
        `Transfer Amount: ${currencySymbol}${booking.airportTransfer.price || 0}`,
        20,
        priceY + 7
      );
    }
    
    // Add line separator for total
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    const lineY = booking.airportTransfer ? priceY + 14 : priceY + 7;
    doc.line(20, lineY, pageWidth - 20, lineY);
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total Amount: ${currencySymbol}${calculateTotalPrice(booking).toFixed(2)}`,
      20,
      lineY + 8
    );
    
    // Add currency information
    doc.setFont('helvetica', 'normal');
    doc.text(`Currency: ${bookingCurrency} (${currencySymbol})`, 20, lineY + 15);
    doc.text(`Payment Date: ${formatDate(new Date())}`, 20, lineY + 22);

    // Add special notes section
    if (booking.specialRequests || booking.airportTransfer?.specialRequests) {
      const notesY = lineY + 30;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL NOTES', 20, notesY);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const notes = booking.specialRequests || booking.airportTransfer?.specialRequests || '';
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
      doc.text(splitNotes, 20, notesY + 10);
    }

    // Add footer with company info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    // Add footer border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    const footerLineY = pageHeight - 30;
    doc.line(20, footerLineY, pageWidth - 20, footerLineY);

    // Company contact info
    doc.text('Holiday Vibes Tour Ltd', pageWidth / 2, pageHeight - 25, {
      align: 'center',
    });
    doc.text(
      'www.holidayvibestour.com',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
    doc.text(
      'Email: Mervbn01@gmail.com | Phone: +230 5813 7644',
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
    doc.save(`booking-invoice-${booking.bookingReference}.pdf`);
  };

  const generateBookingPDF = async (booking) => {
    setSelectedBookingForPDF(booking._id);
    setGeneratingPDF(true);

    try {
      generateCombinedPDF(booking);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
      setSelectedBookingForPDF(null);
    }
  };

  return (
    <DashboardLayout title="My Bookings">
      <div>
        {/* Cancel Notification */}
        {cancelNotification && (
          <div className="fixed top-4 right-4 z-50 w-96">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-blue-800">
                    Cancellation request
                  </p>
                </div>

                <button
                  onClick={handleCloseNotification}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                To cancel booking{' '}
                <span className="font-medium text-gray-900">
                  {cancelNotification.bookingReference}
                </span>
                , please contact our admin team. Total amount: {formatBookingPrice(cancelNotification.totalPrice, {currency: cancelNotification.currency})}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleContactAdminForCancellation}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  Contact admin
                </button>

                <button
                  onClick={handleCloseNotification}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header with Sort Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 flex-1 w-full">
            <nav className="flex space-x-8">
              {Object.entries(bookingCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === status
                      ? status === 'all'
                        ? 'border-blue-600 text-blue-600'
                        : status === 'pending'
                        ? 'border-yellow-500 text-yellow-600'
                        : status === 'confirmed'
                        ? 'border-green-600 text-green-600'
                        : 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                </button>
              ))}
            </nav>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-md px-3 py-2">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <span className="text-sm text-gray-600">Sort by:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleSortChange('newest')}
                className={`px-2 py-1 text-xs rounded ${
                  sortOrder === 'newest'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => handleSortChange('oldest')}
                className={`px-2 py-1 text-xs rounded ${
                  sortOrder === 'oldest'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Oldest First
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedBookings.length > 0 ? (
          <div className="space-y-4">
            {sortedBookings.map((booking) => {
              const bookingCurrency = getBookingCurrency(booking);
              const currencySymbol = getCurrencySymbol(bookingCurrency);
              
              return (
                <div
                  key={booking._id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Activity Image */}
                    <div className="md:w-1/4">
                      <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                        <img
                          src={booking.activity?.image}
                          alt={booking.activity?.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        {/* New Booking Badge */}
                        {new Date() - new Date(booking.createdAt) <
                          24 * 60 * 60 * 1000 && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg
                                className="mr-1.5 h-2 w-2 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              New Booking
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {booking.activity?.title || 'Unknown Activity'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.activity?.location ||
                              'Location not available'}
                          </p>
                          {/* Currency Display */}
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              bookingCurrency === 'EUR' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {currencySymbol} ({bookingCurrency})
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <BookingStatusBadge status={booking.status} />
                          <p className="text-xs text-gray-500 mt-2">
                            Booked: {formatDateTime(booking.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Activity Date
                          </p>
                          <p className="font-medium mt-1">
                            {formatDate(booking.date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Reference
                          </p>
                          <p className="font-medium mt-1">
                            {booking.bookingReference}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Total Price
                          </p>
                          <p className="font-medium mt-1">
                            {formatBookingPrice(calculateTotalPrice(booking), booking)}
                            {booking.airportTransfer &&
                              booking.airportTransfer.price && (
                                <span className="text-xs text-green-600 ml-2">
                                  (includes transfer)
                                </span>
                              )}
                          </p>
                        </div>
                      </div>

                      {/* Airport Transfer Info */}
                      {booking.airportTransfer &&
                        booking.airportTransfer.selected && (
                          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center text-sm">
                                <svg
                                  className="w-4 h-4 text-blue-500 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                                <span className="font-medium text-blue-700">
                                  Airport Transfer:{' '}
                                </span>
                                <span className="text-blue-600 ml-1">
                                  {formatBookingPrice(
                                    booking.airportTransfer.price, 
                                    {currency: booking.airportTransfer.currency || bookingCurrency}
                                  )}
                                </span>
                                {booking.airportTransfer.type && (
                                  <span className="ml-2 text-blue-500">
                                    ({booking.airportTransfer.type})
                                  </span>
                                )}
                              </div>

                              {/* Airport Name and Code */}
                              {booking.airportTransfer.airportName && (
                                <div className="ml-6 flex items-center text-sm">
                                  <svg
                                    className="w-4 h-4 text-gray-500 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <span className="font-medium text-gray-600">
                                    Airport:{' '}
                                  </span>
                                  <span className="ml-1 text-gray-700">
                                    {booking.airportTransfer.airportName}
                                    {booking.airportTransfer.airportCode && (
                                      <span className="ml-1 font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded">
                                        ({booking.airportTransfer.airportCode})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}

                              {booking.airportTransfer.details && (
                                <p className="text-sm text-blue-600 ml-6">
                                  {booking.airportTransfer.details}
                                </p>
                              )}

                              {/* Transfer Status */}
                              <div className="mt-2 flex items-center">
                                <span className="text-xs font-medium text-gray-600 mr-2">
                                  Transfer Status:
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    booking.airportTransfer.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : booking.airportTransfer.status ===
                                        'confirmed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : booking.airportTransfer.status ===
                                        'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : booking.airportTransfer.status ===
                                        'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {booking.airportTransfer.status
                                    .charAt(0)
                                    .toUpperCase() +
                                    booking.airportTransfer.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* PDF Download Section */}
                      {booking.airportTransfer &&
                        booking.airportTransfer.status === 'completed' && (
                          <div className="mb-4 p-3 bg-green-50 rounded border border-green-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <svg
                                  className="w-5 h-5 text-green-600 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-green-700">
                                    Invoice Available
                                  </p>
                                  <p className="text-xs text-green-600">
                                    Your booking is now complete and paid
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => generateBookingPDF(booking)}
                                disabled={
                                  generatingPDF &&
                                  selectedBookingForPDF === booking._id
                                }
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                {generatingPDF &&
                                selectedBookingForPDF === booking._id ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-4 h-4 mr-1.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      ></path>
                                    </svg>
                                    Download Invoice PDF
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                      <div className="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                        <div className="text-sm text-gray-500">
                          {/* Intentionally left empty */}
                        </div>
                        <div className="flex space-x-2">
                          {/* PDF Download Button */}
                          {booking.airportTransfer &&
                            booking.airportTransfer.status === 'completed' && (
                              <button
                                onClick={() => generateBookingPDF(booking)}
                                disabled={
                                  generatingPDF &&
                                  selectedBookingForPDF === booking._id
                                }
                                className="inline-flex items-center px-3 py-1.5 border border-green-300 text-green-700 text-sm rounded hover:bg-green-50 transition-colors"
                              >
                                {generatingPDF &&
                                selectedBookingForPDF === booking._id ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-4 h-4 mr-1.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      ></path>
                                    </svg>
                                    Invoice
                                  </>
                                )}
                              </button>
                            )}

                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
                            >
                              Cancel Booking
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="px-3 py-1.5 border border-yellow-300 text-yellow-700 text-sm rounded hover:bg-yellow-50 transition-colors"
                            >
                              Request Cancellation
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {activeTab === 'all'
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings.`}
            </p>
            <a
              href="/activities"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Browse Activities
            </a>
          </div>
        )}

        {/* Refresh Button */}
        {!loading && sortedBookings.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh List
            </button>
          </div>
        )}

        <div className="ml-4 bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-600"></i>
            Cancellation Policy
          </h3>

          <ul className="text-sm text-blue-800 space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-exclamation-circle text-blue-600"></i>
              </span>
              <span>
                <strong>All Bookings:</strong> Please contact the admin team for
                any cancellation requests.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <i className="fas fa-phone text-green-600"></i>
              </span>
              <span>
                <strong>Contact:</strong> +230 5813 7644
                <br />
                <span className="text-blue-700">Mervbn01@gmail.com</span>
              </span>
            </li>
          </ul>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg text-sm text-blue-900">
            <strong>Important:</strong> Please contact our admin team for
            assistance.
          </div>
        </div>
      </div>
      <DashboardDebugger />
    </DashboardLayout>
  );
};

export default MyBookings;