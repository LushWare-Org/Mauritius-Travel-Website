import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tourPackageBookingsAPI } from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import BookingStatusBadge from '../../components/dashboard/BookingStatusBadge';
import { currencyConfig, getCurrencySymbol, formatPrice, getCurrencyName } from '../../utils/currency';

const TourPackageBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [printMode, setPrintMode] = useState(false);

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

  // Use the currency-specific format function
  const formatCurrency = (amount) => {
    return formatPrice(amount, bookingCurrency);
  };

  // Get price based on booking currency - FIXED LOGIC
  const getPrice = (priceMur, priceEur) => {
    if (!booking) return 0;
    
    if (bookingCurrency === 'EUR') {
      return priceEur || 0;
    } else {
      return priceMur || 0;
    }
  };

  // Calculate package total - FIXED LOGIC
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

  // Calculate activities total - FIXED LOGIC
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

  // Calculate transfer total - FIXED LOGIC
  const calculateTransferTotal = () => {
    if (!booking) return 0;
    
    // Use pre-calculated total if available
    if (bookingCurrency === 'EUR' && booking.transferTotalEur !== undefined) {
      return booking.transferTotalEur;
    }
    
    if (bookingCurrency === 'MUR' && booking.transferTotal !== undefined) {
      return booking.transferTotal;
    }
    
    // Check airport transfer booking
    if (booking.airportTransferBooking?.totalPrice) {
      return booking.airportTransferBooking.totalPrice;
    }
    
    return 0;
  };

  // Get the display total - FIXED LOGIC
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
    return calculatePackageTotal() + calculateActivitiesTotal() + calculateTransferTotal();
  };

  // Get price per person - FIXED LOGIC
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

  // Handle print
  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(false), 500);
    }, 100);
  };

  // Get activity price for display - FIXED LOGIC
  const getActivityPrice = (activity) => {
    if (!activity) return 0;
    
    if (bookingCurrency === 'EUR') {
      return activity.priceEur || 0;
    } else {
      return activity.price || 0;
    }
  };

  // Calculate totals for display - IMPORTANT: Use these values everywhere
  const pricePerPerson = getPricePerPerson();
  const packageTotal = calculatePackageTotal();
  const activitiesTotal = calculateActivitiesTotal();
  const transferTotal = calculateTransferTotal();
  const displayTotal = getDisplayTotal();

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
        storedTotalPrice: booking.totalPrice,
        storedTotalPriceEur: booking.totalPriceEur,
        storedPackagePrice: booking.packagePrice,
        storedPackagePriceEur: booking.packagePriceEur,
        storedActivitiesTotal: booking.activitiesTotal,
        storedActivitiesTotalEur: booking.activitiesTotalEur,
        storedTransferTotal: booking.transferTotal,
        storedTransferTotalEur: booking.transferTotalEur,
        // Debug: Show the actual calculation
        calculatedTotal: packageTotal + activitiesTotal + transferTotal,
        // Debug: Check airport transfer details
        airportTransferBooking: booking.airportTransferBooking,
        hasAirportTransfer: booking.airportTransferBooking ? true : false
      });
    }
  }, [booking]);

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

  // Print View Component - FIXED: Now correctly includes transfer total in grand total
  const PrintView = () => {
    // Calculate final total for PDF - MUST INCLUDE TRANSFER TOTAL
    const pdfPackageTotal = packageTotal;
    const pdfActivitiesTotal = activitiesTotal;
    const pdfTransferTotal = transferTotal;
    const pdfGrandTotal = displayTotal; // This already includes transfer total from getDisplayTotal()
    
    return (
      <div className="print-container p-8" style={{ display: printMode ? 'block' : 'none' }}>
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .no-print {
                display: none !important;
              }
              .print-section {
                page-break-inside: avoid;
              }
            }
          `}
        </style>
        
        {/* Agency Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6 print-section">
          <div className="flex justify-center items-center mb-4">
            {/* Replace with your actual logo */}
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-4">
              AT
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-800">Agency Tours</h1>
              <p className="text-gray-600">Your Trusted Travel Partner in Mauritius</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-700">
              <strong>Address:</strong> Royal Road, Grand Bay, Mauritius
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> +230 5XXX XXXX | <strong>Email:</strong> info@agencytours.mu
            </p>
            <p className="text-gray-700">
              <strong>Website:</strong> www.agencytours.mu
            </p>
          </div>
        </div>

        {/* Booking Header */}
        <div className="mb-8 print-section">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">BOOKING CONFIRMATION</h2>
              <p className="text-gray-600 mt-2">Booking Reference: <strong>{booking.bookingReference}</strong></p>
              <p className="text-gray-600">Booking Date: <strong>{formatDate(booking.createdAt)}</strong></p>
              <p className="text-gray-600">Status: <strong className="uppercase">{booking.status}</strong></p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bookingCurrency === 'EUR' 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  <i className={`fas fa-money-bill-wave mr-2 ${
                    bookingCurrency === 'EUR' ? 'text-blue-600' : 'text-green-600'
                  }`}></i>
                  Paid in {currencySymbol} ({bookingCurrency})
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Document No:</p>
                <p className="font-bold">BK-{booking.bookingReference}</p>
                <p className="text-sm text-gray-600 mt-2">Print Date:</p>
                <p className="font-bold">{new Date().toLocaleDateString('en-US')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-8 print-section">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">CUSTOMER INFORMATION</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium w-1/3">Full Name:</td>
                    <td className="py-2 font-bold">{booking.fullName || currentUser?.name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Email:</td>
                    <td className="py-2">{booking.email || currentUser?.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Phone:</td>
                    <td className="py-2">{booking.phone || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium w-1/3">Start Date:</td>
                    <td className="py-2 font-bold">{formatDate(booking.startDate)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Number of Guests:</td>
                    <td className="py-2 font-bold">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Currency:</td>
                    <td className="py-2 font-bold">
                      {bookingCurrency} ({currencySymbol})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Special Requests:</td>
                    <td className="py-2">{booking.specialRequests || 'None'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tour Package Details */}
        <div className="mb-8 print-section">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">TOUR PACKAGE DETAILS</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">{booking.tourPackage?.title || "Tour Package"}</h4>
            <p className="text-gray-700 mb-3">{booking.tourPackage?.description || 'No description available'}</p>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-600 font-medium">Price per Person:</td>
                  <td className="py-2 font-bold">{formatCurrency(pricePerPerson)}</td>
                  <td className="py-2 text-gray-600 font-medium">Number of Guests:</td>
                  <td className="py-2 font-bold">{booking.guests}</td>
                  <td className="py-2 text-gray-600 font-medium">Package Total:</td>
                  <td className="py-2 font-bold">{formatCurrency(pdfPackageTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Activities Details */}
        {pdfActivitiesTotal > 0 && booking.selectedActivities && booking.selectedActivities.length > 0 && (
          <div className="mb-8 print-section">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">SELECTED ACTIVITIES</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left">Activity</th>
                  <th className="border border-gray-300 p-3 text-left">Price per Person</th>
                  <th className="border border-gray-300 p-3 text-left">Quantity</th>
                  <th className="border border-gray-300 p-3 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {booking.selectedActivities.map((item, index) => {
                  const quantity = item.quantity || booking.guests || 1;
                  const price = getActivityPrice(item);
                  const itemTotal = price * quantity;
                  
                  return (
                    <tr key={index} className="border border-gray-300">
                      <td className="border border-gray-300 p-3">{item.title}</td>
                      <td className="border border-gray-300 p-3">{formatCurrency(price)}</td>
                      <td className="border border-gray-300 p-3">{quantity}</td>
                      <td className="border border-gray-300 p-3 font-medium">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan="3" className="border border-gray-300 p-3 text-right">Activities Subtotal:</td>
                  <td className="border border-gray-300 p-3">{formatCurrency(pdfActivitiesTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Transfer Details */}
        {pdfTransferTotal > 0 && (
          <div className="mb-8 print-section">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">AIRPORT TRANSFER</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium w-1/3">Transfer Service:</td>
                    <td className="py-2 font-bold">{booking.airportTransferBooking?.transfer?.airportName || 'Airport Transfer'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Trip Type:</td>
                    <td className="py-2">{booking.airportTransferBooking?.tripType?.replace('-', ' ') || 'One Way'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600 font-medium">Transfer Total:</td>
                    <td className="py-2 font-bold">{formatCurrency(pdfTransferTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Price Summary - FIXED: Now correctly includes transfer total */}
        <div className="mb-8 print-section">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">PRICE SUMMARY</h3>
          <div className="mb-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
              bookingCurrency === 'EUR' 
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              <i className={`fas fa-money-bill-wave mr-2 ${
                bookingCurrency === 'EUR' ? 'text-blue-600' : 'text-green-600'
              }`}></i>
              All amounts shown in {currencySymbol} ({bookingCurrency})
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="py-4 px-4 text-gray-700 font-medium border-b border-gray-300">Tour Package Total:</td>
                  <td className="py-4 px-4 text-right font-medium border-b border-gray-300">{formatCurrency(pdfPackageTotal)}</td>
                </tr>
                
                {pdfActivitiesTotal > 0 && (
                  <tr>
                    <td className="py-4 px-4 text-gray-700 font-medium border-b border-gray-300">Activities Total:</td>
                    <td className="py-4 px-4 text-right font-medium border-b border-gray-300">{formatCurrency(pdfActivitiesTotal)}</td>
                  </tr>
                )}
                
                {pdfTransferTotal > 0 && (
                  <tr>
                    <td className="py-4 px-4 text-gray-700 font-medium border-b border-gray-300">Transfer Total:</td>
                    <td className="py-4 px-4 text-right font-medium border-b border-gray-300">{formatCurrency(pdfTransferTotal)}</td>
                  </tr>
                )}
                
                <tr className="bg-gray-50">
                  <td className="py-5 px-4 text-lg font-bold">GRAND TOTAL ({bookingCurrency}):</td>
                  <td className="py-5 px-4 text-right text-lg font-bold text-blue-700">
                    {formatCurrency(pdfGrandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Verification note - Updated to show correct calculation */}
          <div className="mt-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
            <p><strong>Note:</strong> Grand total is calculated as:</p>
            <p>Tour Package ({formatCurrency(pdfPackageTotal)}) + 
               Activities ({formatCurrency(pdfActivitiesTotal)}) + 
               Transfer ({formatCurrency(pdfTransferTotal)}) = 
               {formatCurrency(pdfGrandTotal)}</p>
            <p className="mt-1">
              <strong>Breakdown:</strong> {formatCurrency(pdfPackageTotal)} + {formatCurrency(pdfActivitiesTotal)} + {formatCurrency(pdfTransferTotal)} = {formatCurrency(pdfGrandTotal)}
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8 print-section">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">TERMS & CONDITIONS</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. This booking confirmation serves as an official document for your reservation.</p>
            <p>2. Full payment is required at least 24 hours before the tour date.</p>
            <p>3. Cancellations must be made at least 24 hours in advance for a full refund.</p>
            <p>4. No-shows will be charged the full amount.</p>
            <p>5. Changes to booking are subject to availability.</p>
            <p>6. Agency Tours is not responsible for weather-related cancellations.</p>
            <p>7. Please arrive 15 minutes before the scheduled start time.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600 print-section">
          <p>Thank you for choosing Agency Tours!</p>
          <p className="mt-2">For any questions or assistance, please contact us:</p>
          <p><strong>Phone:</strong> +230 5XXX XXXX | <strong>Email:</strong> support@agencytours.mu</p>
          <p className="mt-4">This is an electronically generated document. No signature required.</p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Booking Details">
      {printMode && <PrintView />}
      
      <div className={printMode ? 'no-print' : ''}>
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
                    <span className="text-gray-600">Price per Person:</span>
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
                          {formatCurrency(price)} per person × {quantity} {quantity === 1 ? 'person' : 'people'}
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
                        {booking.airportTransferBooking?.transfer?.airportName || 'Airport Transfer'}:
                      </span>
                      <span>{formatCurrency(transferTotal)} ({booking.airportTransferBooking?.tripType?.replace('-', ' ') || 'One Way'})</span>
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
                onClick={handlePrint}
                className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                Print Booking
              </button>
              <button
                onClick={() => navigate('/dashboard/tour-package-bookings')}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Back to Bookings
              </button>
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Note: Bookings can only be cancelled at least 24 hours before the start date.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TourPackageBookingDetail;