import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { tourPackageBookingsAPI } from '../../utils/api';
import { getCurrencySymbol, formatPrice, getCurrencyName } from '../../utils/currency';
import { jsPDF } from 'jspdf';
import logo from '../../assets/logo.png';

const TourPackageBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
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
    const fetchBooking = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('🔍 Fetching booking details for ID:', id);
        const response = await tourPackageBookingsAPI.getById(id);

        if (response.data.success) {
          console.log('✅ Booking fetched successfully:', response.data.data);
          console.log('💰 Currency data:', {
            currency: response.data.data?.currency,
            totalPrice: response.data.data?.totalPrice,
            totalPriceEur: response.data.data?.totalPriceEur,
            totalPriceMur: response.data.data?.totalPriceMur,
            packagePrice: response.data.data?.packagePrice,
            packagePriceEur: response.data.data?.packagePriceEur,
          });
          setBooking(response.data.data);
        } else {
          setError(
            'Failed to fetch booking details: ' + (response.data.message || '')
          );
        }
      } catch (err) {
        console.error('❌ Error fetching booking:', err);
        setError('Error connecting to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get display price based on booking currency
  const getDisplayPrice = (priceType) => {
    if (!booking) return 0;

    const bookingCurrency = booking.currency || 'MUR';

    switch (priceType) {
      case 'total':
        if (bookingCurrency === 'EUR') {
          return booking.totalPriceEur || booking.totalPrice || 0;
        } else {
          return booking.totalPriceMur || booking.totalPrice || 0;
        }
      case 'package':
        if (bookingCurrency === 'EUR') {
          return booking.packagePriceEur || booking.packagePrice || 0;
        } else {
          return booking.packagePrice || booking.packagePrice || 0;
        }
      case 'activities':
        if (bookingCurrency === 'EUR') {
          return booking.activitiesTotalEur || booking.activitiesTotal || 0;
        } else {
          return booking.activitiesTotal || 0;
        }
      case 'transfer':
        if (bookingCurrency === 'EUR') {
          return booking.transferTotalEur || booking.transferTotal || 0;
        } else {
          return booking.transferTotal || 0;
        }
      default:
        return 0;
    }
  };

  // Format price with proper currency symbol
  const formatBookingPrice = (price, currency = null) => {
    const bookingCurrency = currency || booking?.currency || 'MUR';
    return formatPrice(price, bookingCurrency);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError('');
    try {
      const response = await tourPackageBookingsAPI.updateStatus(id, newStatus);
      if (response.data.success) {
        setBooking({ ...booking, status: newStatus });
      } else {
        setError(
          'Failed to update booking status: ' + (response.data.message || '')
        );
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Get booking currency
  const getBookingCurrency = () => {
    if (!booking) return 'MUR';
    
    if (booking.currency) {
      return booking.currency.toUpperCase();
    }
    
    if (booking.totalPriceEur > 0 || booking.packagePriceEur > 0) {
      return 'EUR';
    }
    
    return 'MUR';
  };

  const bookingCurrency = booking ? getBookingCurrency() : 'MUR';
  const currencySymbol = getCurrencySymbol(bookingCurrency);
  const currencyName = getCurrencyName(bookingCurrency);

  // Format date for PDF
  const formatDatePDF = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return formatPrice(amount, bookingCurrency);
  };

  // Calculate package total
  const calculatePackageTotal = () => {
    if (!booking) return 0;
    
    const guests = booking.guests || 1;
    
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
    
    if (bookingCurrency === 'EUR' && booking.activitiesTotalEur !== undefined) {
      return booking.activitiesTotalEur;
    }
    
    if (bookingCurrency === 'MUR' && booking.activitiesTotal !== undefined) {
      return booking.activitiesTotal;
    }
    
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

  // Get transfer total
  const getTransferTotal = () => {
    if (!booking) return 0;
    
    if (booking.airportTransferBooking) {
      if (bookingCurrency === 'EUR') {
        return booking.airportTransferBooking.totalPriceEur || 0;
      } else {
        return booking.airportTransferBooking.totalPrice || 0;
      }
    }
    
    if (bookingCurrency === 'EUR') {
      return booking.transferTotalEur || 0;
    } else {
      return booking.transferTotal || 0;
    }
  };

  // Get airport transfer details
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

  // Get display total
  const getDisplayTotal = () => {
    if (!booking) return 0;
    
    if (bookingCurrency === 'EUR' && booking.totalPriceEur !== undefined) {
      return booking.totalPriceEur;
    }
    
    if (bookingCurrency === 'MUR' && booking.totalPrice !== undefined) {
      return booking.totalPrice;
    }
    
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
    
    const packageTotal = calculatePackageTotal();
    if (packageTotal > 0) {
      return packageTotal / guests;
    }
    
    return 0;
  };

  // Get activity price
  const getActivityPrice = (activity) => {
    if (!activity) return 0;
    
    if (bookingCurrency === 'EUR') {
      return activity.priceEur || 0;
    } else {
      return activity.price || 0;
    }
  };

  // PDF Generation Function
  const generatePDF = () => {
    if (!booking || !imageLoaded) {
      console.log('Cannot generate PDF: booking or image not loaded');
      return;
    }
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Calculate totals
      const pricePerPerson = getPricePerPerson();
      const packageTotal = calculatePackageTotal();
      const activitiesTotal = calculateActivitiesTotal();
      const transferTotal = getTransferTotal();
      const displayTotal = getDisplayTotal();
      const airportTransferDetails = getAirportTransferDetails();

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
      doc.text(`Name: ${booking.fullName || 'N/A'}`, 20, 93);
      doc.text(`Email: ${booking.email || 'N/A'}`, 20, 100);
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
      doc.text(`Guests: ${booking.guests || 1}`, 20, 154);

      let yPos = 170;

      // =============== PRICE SUMMARY SECTION ===============
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
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Activities:', 20, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        
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

      // Airport Transfer Section
      if (transferTotal > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(20, yPos - 3, pageWidth - 20, yPos - 3);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Airport Transfer:', 20, yPos);
        yPos += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        
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
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 border border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200',
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
          styles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full mr-2 ${styles[status]
            ?.split(' ')[0]
            ?.replace('bg-', 'bg-')}`}
        ></span>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Currency badge component
  const CurrencyBadge = () => {
    if (!booking) return null;

    const bookingCurrency = booking.currency || 'MUR';
    const styles = {
      MUR: 'bg-green-100 text-green-800 border border-green-200',
      EUR: 'bg-blue-100 text-blue-800 border border-blue-200',
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
          styles[bookingCurrency] || styles.MUR
        }`}
      >
        <i className="fas fa-money-bill-wave mr-2"></i>
        {bookingCurrency === 'MUR' ? 'Mauritian Rupees (Rs)' : 'Euro (€)'}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Loading booking details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={() => navigate('/admin/tour-packages/bookings')}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
        >
          Back to Bookings
        </button>
      </AdminLayout>
    );
  }

  if (!booking) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-600">
            Booking not found
          </h2>
          <button
            onClick={() => navigate('/admin/tour-packages/bookings')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  const totalPrice = getDisplayPrice('total');
  const packagePrice = getDisplayPrice('package');
  const activitiesTotal = getDisplayPrice('activities');
  const transferTotal = getDisplayPrice('transfer');
  const totalPackagePrice = packagePrice * (booking.guests || 1);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Booking Details
              <span className="ml-2 text-gray-500 text-lg font-normal">
                #{booking.bookingReference}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <CurrencyBadge />
              <StatusBadge status={booking.status} />
              <span className="text-sm text-gray-500">
                Created on {formatDate(booking.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/tour-packages/bookings')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Bookings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Booking Summary
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Complete booking information
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Tour Package
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.tourPackage?.title || 'Unknown Package'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(booking.startDate || booking.date)}
                  </dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Package Price
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    
                    {formatBookingPrice(totalPackagePrice)}
                  </dd>
                </div>

                {/* Activities */}
                {activitiesTotal > 0 && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Activities Total
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatBookingPrice(activitiesTotal)}
                    </dd>
                  </div>
                )}

                {/* Transfer */}
                {transferTotal > 0 && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Transfer Total
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatBookingPrice(transferTotal)}
                    </dd>
                  </div>
                )}

                {/* Total Price */}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Total Price
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-blue-700 sm:mt-0 sm:col-span-2">
                    {formatBookingPrice(totalPrice)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Activities Details */}
          {booking.selectedActivities &&
            booking.selectedActivities.length > 0 && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Selected Activities
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {booking.selectedActivities.length} activities selected
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Activity
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {booking.selectedActivities.map((activity, index) => {
                          const activityPrice =
                            bookingCurrency === 'EUR'
                              ? activity.priceEur || activity.price || 0
                              : activity.price || 0;
                          const activityQuantity =
                            activity.quantity || booking.guests || 1;
                          const activityTotal =
                            activityPrice * activityQuantity;

                          return (
                            <tr key={index}>
                              <td className="px-4 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {activity.title}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {activityQuantity}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {formatBookingPrice(activityPrice)}
                              </td>
                              <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                {formatBookingPrice(activityTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Customer Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Personal and contact details
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.fullName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.email}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.phone}
                  </dd>
                </div>
                {booking.user && (
                  <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      User Account
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.user.name} ({booking.user.email})
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Special Requests */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Special Requests
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-4">
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                  {booking.specialRequests || 'None provided'}
                </p>
              </div>
            </div>
          </div>

          {/* PDF Download Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Document Generation
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <button
                  onClick={generatePDF}
                  disabled={!imageLoaded || !booking}
                  className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fas fa-file-pdf mr-2"></i>
                  Download PDF Invoice
                </button>
                {!imageLoaded && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Loading document template...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Booking Actions
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="px-4 py-5 sm:p-6 space-y-3">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      disabled={updating}
                      className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>
                          Confirm Booking
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={updating}
                      className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fas fa-times-circle mr-2"></i>
                      Cancel Booking
                    </button>
                  </>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updating}
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-times-circle mr-2"></i>
                    Cancel Booking
                  </button>
                )}

                {booking.status === 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={updating}
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-redo mr-2"></i>
                    Reactivate Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default TourPackageBookingDetail;