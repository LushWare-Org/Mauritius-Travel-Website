import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tourPackageBookingsAPI } from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import BookingStatusBadge from '../../components/dashboard/BookingStatusBadge';
import { currencyConfig, getCurrencySymbol, formatPrice, getCurrencyName } from '../../utils/currency';
import { jsPDF } from 'jspdf';
import logo from '../../assets/logo.png';

const TourPackageBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
    const fetchBookingDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view booking details');
          navigate('/login');
          return;
        }

        const response = await tourPackageBookingsAPI.getById(id);
        
        if (response.data.success) {
          const bookingData = response.data.data;
          
          // User authorization check
          let bookingUserId;
          
          if (typeof bookingData.user === 'object' && bookingData.user !== null) {
            bookingUserId = bookingData.user._id?.toString();
          } else if (typeof bookingData.user === 'string') {
            bookingUserId = bookingData.user;
          } else {
            bookingUserId = bookingData.userId || bookingData.user;
          }
          
          const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
          
          // If we can't get a valid user ID, skip the check and show the booking
          if (!bookingUserId) {
            console.log('⚠️ Booking user ID not found, showing booking anyway');
            setBooking(bookingData);
            return;
          }
          
          if (!currentUserId) {
            console.log('⚠️ Current user ID not found');
            setError('Please log in to view booking details');
            navigate('/login');
            return;
          }
          
          if (bookingUserId.toString() !== currentUserId.toString() && currentUser?.role !== 'admin') {
            console.log('⛔ Unauthorized access');
            setError('You are not authorized to view this booking');
            setTimeout(() => navigate('/dashboard/tour-package-bookings'), 2000);
            return;
          }
          
          setBooking(bookingData);
        } else {
          setError(response.data.message || 'Failed to fetch booking details');
        }
      } catch (err) {
        console.error('Error in fetchBookingDetails:', err);
        
        if (err.response?.status === 404) {
          setError('Booking not found');
        } else if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          navigate('/login');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this booking.');
          setTimeout(() => navigate('/dashboard/tour-package-bookings'), 2000);
        } else if (err.response?.status === 500) {
          setError('Server error. Please try again later or contact support.');
        } else if (err.message.includes('Network Error')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id && currentUser) {
      fetchBookingDetails();
    } else if (id && !currentUser) {
      setError('Please log in to view booking details');
      navigate('/login');
    } else {
      setError('Invalid booking reference');
      navigate('/dashboard/tour-package-bookings');
    }
  }, [id, currentUser, navigate]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    setCancelling(true);
    try {
      const response = await tourPackageBookingsAPI.cancel(id);

      if (response.data.success) {
        setBooking(response.data.data);
        alert('Booking cancelled successfully');
      } else {
        setError('Failed to cancel booking: ' + (response.data.message || ''));
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // Get booking currency
  const getBookingCurrency = () => {
    if (!booking) return 'MUR';
    
    // Check currency in multiple possible fields
    if (booking.currency) {
      return booking.currency.toUpperCase(); // 'MUR' or 'EUR'
    }
    
    // Check if prices are stored in EUR
    if (booking.totalPriceEur > 0 || booking.packagePriceEur > 0) {
      return 'EUR';
    }
    
    // Default to MUR
    return 'MUR';
  };

  const bookingCurrency = getBookingCurrency();
  const currencySymbol = getCurrencySymbol(bookingCurrency);
  const currencyName = getCurrencyName(bookingCurrency);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // PDF Format Date (shorter version)
  const formatDatePDF = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Use the currency-specific format function
  const formatCurrency = (amount) => {
    return formatPrice(amount, bookingCurrency);
  };

  // Get price based on booking currency
  const getPrice = (priceMur, priceEur) => {
    if (!booking) return 0;
    
    if (bookingCurrency === 'EUR') {
      return priceEur || 0;
    } else {
      return priceMur || 0;
    }
  };

  // Calculate package total
  const calculatePackageTotal = () => {
    if (!booking) return 0;
    
    const guests = booking.guests || 1;
    
    // First check if package price is already calculated in the correct currency
    if (bookingCurrency === 'EUR') {
      if (booking.packagePriceEur) {
        return booking.packagePriceEur * guests;
      }
      if (booking.tourPackage?.priceEur && booking.tourPackage?.priceEur > 0) {
        return booking.tourPackage.priceEur * guests;
      }
    } else {
      if (booking.packagePrice) {
        return booking.packagePrice * guests;
      }
      if (booking.tourPackage?.price && booking.tourPackage?.price > 0) {
        return booking.tourPackage.price * guests;
      }
    }
    
    return 0;
  };

  // Calculate activities total
  const calculateActivitiesTotal = () => {
    if (!booking) return 0;
    
    // Use pre-calculated total if available
    if (bookingCurrency === 'EUR' && booking.activitiesTotalEur !== undefined) {
      return booking.activitiesTotalEur;
    }
    
    if (bookingCurrency === 'MUR' && booking.activitiesTotal !== undefined) {
      return booking.activitiesTotal;
    }
    
    // Calculate from individual activities
    if (booking.selectedActivities && booking.selectedActivities.length > 0) {
      return booking.selectedActivities.reduce((total, activity) => {
        const quantity = activity.quantity || booking.guests || 1;
        let price = 0;
        
        if (bookingCurrency === 'EUR') {
          price = activity.priceEur || 0;
        } else {
          price = activity.price || 0;
        }
        
        return total + (price * quantity);
      }, 0);
    }
    
    return 0;
  };

  // Get transfer total - Enhanced to get detailed transfer info
  // Get transfer total - FIXED version
const getTransferTotal = () => {
  if (!booking) return 0;
  
  // Check if we have airport transfer booking data
  if (booking.airportTransferBooking) {
    // Use the correct currency field
    if (bookingCurrency === 'EUR') {
      return booking.airportTransferBooking.totalPriceEur || 0;
    } else {
      return booking.airportTransferBooking.totalPrice || 0;
    }
  }
  
  // Fallback to stored transferTotal fields
  if (bookingCurrency === 'EUR') {
    return booking.transferTotalEur || 0;
  } else {
    return booking.transferTotal || 0;
  }
};

  // Get airport transfer details for PDF
  const getAirportTransferDetails = () => {
    if (!booking || !booking.airportTransferBooking) return null;
    
    const transfer = booking.airportTransferBooking;
    return {
      airportName: transfer.transfer?.airportName || 'Airport Transfer',
      airportCode: transfer.transfer?.airportCode || '',
      vehicleType: transfer.transfer?.vehicleType || '',
      tripType: transfer.tripType || 'one-way',
      guests: transfer.passengers || booking.guests || 1,
      price: bookingCurrency === 'EUR' ? transfer.totalPriceEur : transfer.totalPrice,
      arrivalDate: transfer.arrivalDate,
      arrivalTime: transfer.arrivalTime,
      departureDate: transfer.departureDate,
      departureTime: transfer.departureTime,
      flightNumber: transfer.flightNumber
    };
  };

  // Get the display total
  const getDisplayTotal = () => {
    if (!booking) return 0;
    
    // Use stored total price in correct currency
    if (bookingCurrency === 'EUR' && booking.totalPriceEur !== undefined) {
      return booking.totalPriceEur;
    }
    
    if (bookingCurrency === 'MUR' && booking.totalPrice !== undefined) {
      return booking.totalPrice;
    }
    
    // Calculate from components as fallback
    return calculatePackageTotal() + calculateActivitiesTotal() + getTransferTotal();
  };

  // Get price per person
  const getPricePerPerson = () => {
    if (!booking) return 0;
    
    const guests = booking.guests || 1;
    
    if (bookingCurrency === 'EUR') {
      if (booking.packagePriceEur) {
        return booking.packagePriceEur;
      }
      if (booking.tourPackage?.priceEur && booking.tourPackage?.priceEur > 0) {
        return booking.tourPackage.priceEur;
      }
    } else {
      if (booking.packagePrice) {
        return booking.packagePrice;
      }
      if (booking.tourPackage?.price && booking.tourPackage?.price > 0) {
        return booking.tourPackage.price;
      }
    }
    
    // Calculate from total if needed
    const packageTotal = calculatePackageTotal();
    if (packageTotal > 0) {
      return packageTotal / guests;
    }
    
    return 0;
  };

  // Get activity price for display
  const getActivityPrice = (activity) => {
    if (!activity) return 0;
    
    if (bookingCurrency === 'EUR') {
      return activity.priceEur || 0;
    } else {
      return activity.price || 0;
    }
  };

  // Calculate totals for display
  const pricePerPerson = getPricePerPerson();
  const packageTotal = calculatePackageTotal();
  const activitiesTotal = calculateActivitiesTotal();
  const transferTotal = getTransferTotal();
  const displayTotal = getDisplayTotal();
  const airportTransferDetails = getAirportTransferDetails();

  // Debug logging
  useEffect(() => {
    if (booking) {
      console.log('💰 Booking Price Calculation:', {
        bookingCurrency,
        pricePerPerson,
        packageTotal,
        activitiesTotal,
        transferTotal,
        displayTotal,
        airportTransferDetails,
        storedTotalPrice: booking.totalPrice,
        storedTotalPriceEur: booking.totalPriceEur,
        storedPackagePrice: booking.packagePrice,
        storedPackagePriceEur: booking.packagePriceEur,
        storedActivitiesTotal: booking.activitiesTotal,
        storedActivitiesTotalEur: booking.activitiesTotalEur,
        storedTransferTotal: booking.transferTotal,
        storedTransferTotalEur: booking.transferTotalEur,
        calculatedTotal: packageTotal + activitiesTotal + transferTotal,
      });
    }
  }, [booking]);


// PDF Generation Function - Updated Price Summary Section
const generatePDF = () => {
  if (!booking || !imageLoaded) return;
  
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
  doc.text('Tour Package Booking Confirmation', pageWidth / 2, 30, {
    align: 'center',
  });

  // Add booking details title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TOUR PACKAGE CONFIRMATION', pageWidth / 2, 50, { align: 'center' });

  // Add booking reference
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Booking Reference: ${booking.bookingReference}`,
    pageWidth / 2,
    60,
    { align: 'center' }
  );

  // Add booking date and status
  doc.text(
    `Booking Date: ${formatDatePDF(booking.createdAt)} | Status: ${booking.status.toUpperCase()}`,
    pageWidth / 2,
    67,
    { align: 'center' }
  );

  // Add line separator
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, 73, pageWidth - 20, 73);

  // Customer Information Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INFORMATION', 20, 83);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${booking.fullName || currentUser?.name || 'N/A'}`, 20, 93);
  doc.text(`Email: ${booking.email || currentUser?.email || 'N/A'}`, 20, 100);
  doc.text(`Phone: ${booking.phone || 'N/A'}`, 20, 107);
  doc.text(`Currency: ${bookingCurrency} (${currencySymbol})`, 20, 114);

  // Tour Package Details Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TOUR PACKAGE DETAILS', 20, 130);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Package: ${booking.tourPackage?.title || 'Unknown Package'}`, 20, 140);
  doc.text(`Start Date: ${formatDatePDF(booking.startDate)}`, 20, 147);
  

  let yPos = 170;

  // =============== PRICE SUMMARY SECTION - UPDATED ===============
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICE SUMMARY', 20, yPos);
  yPos += 12;

  // Tour Package Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Tour Package:', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Base Price:', 25, yPos);
  doc.text(`${formatCurrency(pricePerPerson)} × ${booking.guests} ${booking.guests === 1 ? 'person' : 'people'}`, 
    pageWidth - 20, yPos, { align: 'right' });
  yPos += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Package Total:', 25, yPos);
  doc.text(formatCurrency(packageTotal), pageWidth - 20, yPos, { align: 'right' });
  yPos += 10;

  // Activities Section
  if (activitiesTotal > 0 && booking.selectedActivities?.length > 0) {
    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Activities:', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // List individual activities
    if (booking.selectedActivities && booking.selectedActivities.length > 0) {
      doc.setFontSize(10);
      booking.selectedActivities.forEach((item, index) => {
        const quantity = item.quantity || booking.guests || 1;
        const price = getActivityPrice(item);
        const total = price * quantity;
        doc.text(`${item.title}:`, 25, yPos);
        doc.text(`${formatCurrency(price)} × ${quantity} = ${formatCurrency(total)}`, 
          pageWidth - 20, yPos, { align: 'right' });
        yPos += 5;
      });
      yPos += 3;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Activities Total:', 25, yPos);
    doc.text(formatCurrency(activitiesTotal), pageWidth - 20, yPos, { align: 'right' });
    yPos += 10;
  }

   // Airport Transfer Section - SIMPLIFIED (just total)
  if (transferTotal > 0) {
    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Airport Transfer:', 20, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Just show the transfer total
    doc.text('Transfer Total:', 25, yPos);
    doc.text(formatCurrency(transferTotal), pageWidth - 20, yPos, { align: 'right' });
    yPos += 12;
  }

  // Grand Total Section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', 20, yPos + 5);
  doc.text(formatCurrency(displayTotal), pageWidth - 20, yPos + 5, { align: 'right' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${bookingCurrency})`, pageWidth - 20, yPos + 10, { align: 'right' });
  
  yPos += 20;
  // =============== END PRICE SUMMARY SECTION ===============

  

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
    'Tour Package Services | www.holidayvibestour.com',
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
  doc.save(`tour-package-${booking.bookingReference}.pdf`);
};
  // Currency display badge
  const CurrencyBadge = () => (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      bookingCurrency === 'EUR' 
        ? 'bg-blue-100 text-blue-800 border border-blue-200'
        : 'bg-green-100 text-green-800 border border-green-200'
    }`}>
      <i className={`fas fa-money-bill-wave mr-2 ${
        bookingCurrency === 'EUR' ? 'text-blue-600' : 'text-green-600'
      }`}></i>
      Paid in {currencySymbol} ({bookingCurrency})
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => navigate('/dashboard/tour-package-bookings')}
            className="mt-3 bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            Back to Bookings
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Booking not found</h3>
          <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/tour-package-bookings')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Back to Bookings
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Booking Details">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Booking Details</h2>
            <p className="text-gray-600">Reference: <span className="font-medium">{booking.bookingReference}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <BookingStatusBadge status={booking.status} />
            <CurrencyBadge />
          </div>
        </div>
        <div className="mt-2">
          <Link
            to="/dashboard/tour-package-bookings"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to all bookings
          </Link>
        </div>
      </div>

      {/* Currency Information */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          bookingCurrency === 'EUR' 
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-lg mr-4 ${
              bookingCurrency === 'EUR' 
                ? 'bg-blue-100 text-blue-600'
                : 'bg-green-100 text-green-600'
            }`}>
              <i className="fas fa-money-bill-wave text-xl"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {bookingCurrency === 'EUR' ? 'Euro Payment' : 'Rupee Payment'}
              </h3>
              <p className="text-gray-600">
                This booking was made in {currencyName} ({currencySymbol})
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(displayTotal)}
            </div>
            <p className="text-sm text-gray-500">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Booking Information */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tour Package Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-800">{booking.tourPackage?.title || "Unknown Package"}</h4>
                <div className="text-gray-600 mt-1">
                  <p>{booking.tourPackage?.description || 'No description available'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Booking Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{formatDate(booking.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of Guests:</span>
                  <span className="font-medium">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">{formatCurrency(pricePerPerson)}</span>
                </div>
                
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Package Total:</span>
                    <span className="font-medium">{formatCurrency(packageTotal)}</span>
                  </div>
                </div>
                
                {transferTotal > 0 && (
                  <div className="pt-2 border-t border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Airport Transfer:</span>
                      <span className="font-medium">{formatCurrency(transferTotal)}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-gray-300 pt-2">
                  <span className="text-gray-600 font-medium">Total Price:</span>
                  <span className="font-bold text-lg">{formatCurrency(displayTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Activities Section */}
      {activitiesTotal > 0 && booking.selectedActivities && booking.selectedActivities.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Selected Activities</h3>
            <p className="text-gray-600 mb-4">
              {booking.selectedActivities.length} activity(s) included
            </p>
            
            <div className="space-y-4">
              {booking.selectedActivities.map((item, index) => {
                const quantity = item.quantity || booking.guests || 1;
                const price = getActivityPrice(item);
                const itemTotal = price * quantity;
                
                return (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(price)} price × {quantity} {quantity === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">{formatCurrency(itemTotal)}</p>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="font-medium text-gray-700">Activities Subtotal:</span>
                <span className="font-bold text-blue-600">{formatCurrency(activitiesTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Airport Transfer Details Section */}
      {transferTotal > 0 && airportTransferDetails && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Airport Transfer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Airport</p>
                  <p className="font-medium">{airportTransferDetails.airportName} ({airportTransferDetails.airportCode})</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Vehicle Type</p>
                  <p className="font-medium capitalize">{airportTransferDetails.vehicleType}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Trip Type</p>
                  <p className="font-medium capitalize">
                    {airportTransferDetails.tripType === 'both' ? 'Round Trip' : 
                     airportTransferDetails.tripType === 'hotel-to-airport' ? 'Hotel to Airport' : 
                     airportTransferDetails.tripType === 'airport-to-hotel' ? 'Airport to Hotel' : 'One Way'}
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">Passengers</p>
                
                </div>
                {airportTransferDetails.arrivalDate && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-1">Arrival Date & Time</p>
                    <p className="font-medium">
                      {formatDate(airportTransferDetails.arrivalDate)} {airportTransferDetails.arrivalTime ? `at ${airportTransferDetails.arrivalTime}` : ''}
                    </p>
                  </div>
                )}
                {airportTransferDetails.departureDate && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-1">Departure Date & Time</p>
                    <p className="font-medium">
                      {formatDate(airportTransferDetails.departureDate)} {airportTransferDetails.departureTime ? `at ${airportTransferDetails.departureTime}` : ''}
                    </p>
                  </div>
                )}
                {airportTransferDetails.flightNumber && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500 mb-1">Flight Number</p>
                    <p className="font-medium">{airportTransferDetails.flightNumber}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Transfer Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(transferTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Summary Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Price Summary</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Tour Package:</h4>
              <div className="pl-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price:</span>
                  <span>{formatCurrency(pricePerPerson)} × {booking.guests} {booking.guests === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="flex justify-between font-medium mt-1">
                  <span>Package Total:</span>
                  <span>{formatCurrency(packageTotal)}</span>
                </div>
              </div>
            </div>

            {activitiesTotal > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <h4 className="font-medium text-gray-700">Activities:</h4>
                <div className="pl-4">
                  {booking.selectedActivities?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.title}:</span>
                      <span>{formatCurrency(getActivityPrice(item))} × {item.quantity || booking.guests} = {formatCurrency(getActivityPrice(item) * (item.quantity || booking.guests))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium mt-1">
                    <span>Activities Total:</span>
                    <span>{formatCurrency(activitiesTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {transferTotal > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <h4 className="font-medium text-gray-700">Airport Transfer:</h4>
                <div className="pl-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {airportTransferDetails?.airportName || 'Airport Transfer'}:
                    </span>
                    <span>{formatCurrency(transferTotal)} 
                      ({airportTransferDetails?.tripType === 'both' ? 'Round Trip' : 
                        airportTransferDetails?.tripType === 'hotel-to-airport' ? 'Hotel to Airport' : 
                        airportTransferDetails?.tripType === 'airport-to-hotel' ? 'Airport to Hotel' : 'One Way'})
                    </span>
                  </div>
                  <div className="flex justify-between font-medium mt-1">
                    <span>Transfer Total:</span>
                    <span>{formatCurrency(transferTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
              <span>Grand Total ({bookingCurrency}):</span>
              <span className="text-blue-600">{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="font-medium">{booking.fullName || currentUser?.name || 'N/A'}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="font-medium">{booking.email || currentUser?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-medium">{booking.phone || 'N/A'}</p>
              </div>
            </div>
            <div>
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">Booking Currency</p>
                <div className={`inline-flex items-center px-3 py-2 rounded-lg ${
                  bookingCurrency === 'EUR' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  <i className={`fas fa-money-bill-wave mr-2 ${
                    bookingCurrency === 'EUR' ? 'text-blue-600' : 'text-green-600'
                  }`}></i>
                  {bookingCurrency} ({currencySymbol})
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                <div className="bg-gray-50 p-4 rounded border border-gray-100 min-h-[80px]">
                  {booking.specialRequests ? (
                    <p className="text-gray-700">{booking.specialRequests}</p>
                  ) : (
                    <p className="text-gray-500 italic">No special requests</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-800 font-medium">Booking Created</p>
                <p className="text-gray-500 text-sm">{formatDate(booking.createdAt)}</p>
              </div>
            </div>
            {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">Last Updated</p>
                  <p className="text-gray-500 text-sm">{formatDate(booking.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={generatePDF}
              disabled={!imageLoaded}
              className="px-6 py-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Download PDF
            </button>
            
            <button
              onClick={() => navigate('/dashboard/tour-package-bookings')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Bookings
            </button>
            
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-times-circle mr-2"></i>
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TourPackageBookingDetail;