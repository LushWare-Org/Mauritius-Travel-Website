import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, airportTransferBookingAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import logo from '../../assets/logo.png'; 

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [airportTransferBooking, setAirportTransferBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [logoImage, setLogoImage] = useState(null);

  // Load logo image for PDF
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Convert logo to base64 for PDF
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoImage(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading logo:', err);
      }
    };
    
    loadLogo();
  }, []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        // Fetch activity booking
        const bookingResponse = await bookingsAPI.getById(id);
        if (bookingResponse.data.success) {
          console.log('📊 Booking data:', bookingResponse.data.data);
          setBooking(bookingResponse.data.data);
          
          // Try to find associated airport transfer booking
          try {
            const airportBookingsResponse = await airportTransferBookingAPI.getAllBookings();
            if (airportBookingsResponse.data.success) {
              // Look for airport transfer booking linked to this activity booking
              const linkedTransfer = airportBookingsResponse.data.data.find(
                transfer => transfer.specialRequests?.includes(bookingResponse.data.data.bookingReference)
              );
              
              if (linkedTransfer) {
                console.log('📊 Found linked airport transfer booking:', linkedTransfer);
                setAirportTransferBooking(linkedTransfer);
              }
            }
          } catch (transferErr) {
            console.log('No airport transfer booking found or error fetching:', transferErr.message);
          }
        } else {
          setError('Failed to load booking details');
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to connect to the server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format timestamp
  const formatTimestamp = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  // Get duration type display text
  const getDurationTypeDisplay = () => {
    if (!booking) return '';
    
    // Check for durationType first (new field)
    if (booking.durationType) {
      return booking.durationType;
    }
    
    // Check for duration field (old field)
    if (booking.duration === 'halfDay') {
      return 'Half Day';
    } else if (booking.duration === 'fullDay') {
      return 'Full Day';
    }
    
    // Check activity pricing type
    if (booking.activity?.pricingType === 'half-full-day') {
      // If we have pricePerPerson, we can infer
      if (booking.pricePerPerson && booking.activity) {
        if (booking.pricePerPerson === booking.activity.halfDayPrice) {
          return 'Half Day';
        } else if (booking.pricePerPerson === booking.activity.fullDayPrice) {
          return 'Full Day';
        }
      }
    }
    
    return 'Standard';
  };

  // Get price per person display
  const getPricePerPersonDisplay = () => {
    if (booking?.pricePerPerson) {
      return `RS${booking.pricePerPerson}`;
    }
    
    // Calculate from total price and guests
    if (booking?.totalPrice && booking?.guests) {
      return `RS${(booking.totalPrice / booking.guests).toFixed(2)}`;
    }
    
    return 'N/A';
  };

  // Get trip type display
  const getTripTypeDisplay = (tripType) => {
    if (!tripType) return 'N/A';
    return tripType === 'one-way' ? 'One Way' : 'Round Trip';
  };

  // Get transfer type display
  const getTransferTypeDisplay = (transferType) => {
    if (!transferType) return 'N/A';
    return transferType === 'airport-to-hotel' ? 'Airport to Hotel' :
           transferType === 'hotel-to-airport' ? 'Hotel to Airport' :
           transferType;
  };

  // Calculate grand total
  const getGrandTotal = () => {
    let total = booking?.totalPrice || 0;
    if (airportTransferBooking?.totalPrice) {
      total += parseFloat(airportTransferBooking.totalPrice);
    }
    return total;
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await bookingsAPI.updateStatus(id, newStatus);
      if (response.data.success) {
        setBooking({
          ...booking,
          status: newStatus
        });
      } else {
        setError('Failed to update booking status');
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAirportTransferStatusChange = async (newStatus) => {
    if (!airportTransferBooking) return;
    
    setUpdating(true);
    try {
      const response = await airportTransferBookingAPI.updateBookingStatus(
        airportTransferBooking._id, 
        newStatus,
        `Status changed from ${airportTransferBooking.status} to ${newStatus}`
      );
      
      if (response.data.success) {
        setAirportTransferBooking({
          ...airportTransferBooking,
          status: newStatus
        });
      } else {
        setError('Failed to update airport transfer booking status');
      }
    } catch (err) {
      console.error('Error updating airport transfer booking status:', err);
      setError('Failed to update airport transfer booking status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Enhanced PDF generation with improved styling
  const generatePDF = async () => {
    setGeneratingPDF(true);

    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      let y = 30;

      // Add blue header background
      doc.setFillColor(59, 130, 246); // Blue-600
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Try to add logo if available
      try {
        if (logoImage) {
          doc.addImage(logoImage, 'PNG', margin, 5, 30, 30);
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
      doc.text('Booking Invoice & Receipt', pageWidth / 2, 30, {
        align: 'center',
      });

      // Add booking details title
      doc.setTextColor(0, 0, 0); // Black
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
      doc.setDrawColor(59, 130, 246); // Blue-600
      doc.setLineWidth(0.5);
      doc.line(margin, 65, pageWidth - margin, 65);

      y = 75;

      // Customer Information Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CUSTOMER INFORMATION', margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${booking.fullName}`, margin, y);
      y += 7;
      doc.text(`Email: ${booking.email}`, margin, y);
      y += 7;
      doc.text(`Phone: ${booking.phone}`, margin, y);
      y += 7;
      if (booking.specialRequests) {
        const notes = `Special Requests: ${booking.specialRequests}`;
        const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin);
        doc.text(splitNotes, margin, y);
        y += splitNotes.length * 6;
      }

      // Activity Booking Details Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EXCURSION DETAILS', margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Activity: ${booking.activity?.title || 'N/A'}`, margin, y);
      y += 7;
      doc.text(`Date: ${formatDate(booking.date)}`, margin, y);
      y += 7;
      doc.text(`Guests: ${booking.guests}`, margin, y);
      y += 7;
      doc.text(`Duration: ${getDurationTypeDisplay()}`, margin, y);
      y += 7;
      doc.text(`Price Per Person: ${getPricePerPersonDisplay()}`, margin, y);
      y += 10;

      // Airport Transfer Details Section (if exists)
      if (airportTransferBooking) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('AIRPORT TRANSFER DETAILS', margin, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Airport: ${airportTransferBooking.transfer?.airportName || 'N/A'}`, margin, y);
        y += 7;
        doc.text(`Vehicle Type: ${airportTransferBooking.transfer?.vehicleType?.toUpperCase() || 'N/A'}`, margin, y);
        y += 7;
        doc.text(`Trip Type: ${getTripTypeDisplay(airportTransferBooking.tripType)}`, margin, y);
        y += 7;
        doc.text(`Transfer Type: ${getTransferTypeDisplay(airportTransferBooking.transferType)}`, margin, y);
        y += 7;
        doc.text(`Date: ${formatDate(airportTransferBooking.arrivalDate)}`, margin, y);
        y += 7;
        doc.text(`Time: ${formatTime(airportTransferBooking.arrivalTime)}`, margin, y);
        y += 7;
        doc.text(`Passengers: ${airportTransferBooking.passengers || booking.guests}`, margin, y);
        y += 10;
      }

      // Payment Details Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT DETAILS', margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Activity Total
      doc.text(`Excursion Total:`, margin, y);
      doc.text(`RS ${booking.totalPrice || 0}`, pageWidth - margin, y, { align: 'right' });
      y += 7;

      // Airport Transfer Total
      if (airportTransferBooking) {
        const transferPrice = airportTransferBooking.totalPrice || airportTransferBooking.price || 0;
        doc.text(`Airport Transfer:`, margin, y);
        doc.text(`RS ${transferPrice}`, pageWidth - margin, y, { align: 'right' });
        y += 7;
      }

      // Grand Total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Grand Total:`, margin, y);
      doc.text(`RS ${getGrandTotal().toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
      y += 10;

      // Status and Notes
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${booking.status?.toUpperCase() || 'PENDING'}`, margin, y);
      y += 7;
      doc.text(`Payment Date: ${formatDate(new Date())}`, margin, y);
      y += 10;

      // Check if we need a new page
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 30;
      }

      // Add notes section
      const allNotes = [];
      if (booking.adminNotes) allNotes.push(`Admin Notes: ${booking.adminNotes}`);
      if (airportTransferBooking?.specialRequests) allNotes.push(`Transfer Notes: ${airportTransferBooking.specialRequests}`);
      if (airportTransferBooking?.adminNotes) allNotes.push(`Transfer Admin Notes: ${airportTransferBooking.adminNotes}`);

      if (allNotes.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('ADDITIONAL NOTES', margin, y);
        y += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        allNotes.forEach(note => {
          const splitNote = doc.splitTextToSize(note, pageWidth - 2 * margin);
          doc.text(splitNote, margin, y);
          y += splitNote.length * 5 + 2;
        });
      }

      // Add footer with company info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);

      // Add footer border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

      // Company contact info
      doc.text('Holiday Vibes Tour Ltd', pageWidth / 2, pageHeight - 25, {
        align: 'center',
      });
      doc.text(
        'Excursions & Airport Transfer Services | www.holidayvibestour.com',
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
      doc.save(`booking-invoice-${booking.bookingReference}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleGeneratePDF = () => {
    generatePDF();
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };

    const displayText = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      completed: 'Paid',
      paid: 'Paid',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {displayText[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/bookings')}
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
          <h2 className="text-xl font-semibold text-gray-600">Booking not found</h2>
          <button
            onClick={() => navigate('/admin/bookings')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  const durationType = getDurationTypeDisplay();
  const pricePerPerson = getPricePerPersonDisplay();
  const grandTotal = getGrandTotal();
  
  // Check if PDF button should be shown
  const showPDFButton = airportTransferBooking && airportTransferBooking.status === 'completed';

  return (
    <AdminLayout>
      {/* Header */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Booking Details
          <span className="ml-2 text-gray-500 text-lg font-normal">#{booking.bookingReference}</span>
        </h1>
        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          {/* Show PDF button for completed bookings */}
          {(airportTransferBooking?.status === 'completed' || booking.status === 'completed') && (
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 
               border border-blue-600 rounded-md shadow-sm 
               text-sm font-medium text-white 
               bg-blue-600 hover:bg-blue-700 
               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
               transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPDF ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Download Invoice PDF
                </>
              )}
            </button>
          )}
          <button
            onClick={() => navigate('/admin/bookings')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Bookings
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Booking Summary */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Excursions Booking Summary</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Created on {formatTimestamp(booking.createdAt)}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Excursions</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.activity ? booking.activity.title : 'Unknown Activity'}
                  {booking.activity?.pricingType === 'half-full-day' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Half/Full Day Pricing
                    </span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Booking Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(booking.date)}
                </dd>
              </div>
              
              {/* Duration Type (Half Day / Full Day) */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Duration Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      durationType === 'Half Day' 
                        ? 'bg-purple-100 text-purple-800' 
                        : durationType === 'Full Day'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {durationType === 'Half Day' && (
                        <svg className="mr-1.5 h-2 w-2 text-purple-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {durationType === 'Full Day' && (
                        <svg className="mr-1.5 h-2 w-2 text-indigo-600" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      )}
                      {durationType}
                    </span>
                  </div>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.guests} {booking.guests === 1 ? 'person' : 'people'}
                </dd>
              </div>
              
              {/* Price Per Person */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Price Per Person</dt>
                <dd className="mt-1 text-sm font-medium text-green-700 sm:mt-0 sm:col-span-2">
                  {pricePerPerson}
                  {durationType !== 'Standard' && (
                    <span className="ml-2 text-xs text-gray-500">({durationType})</span>
                  )}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Excursions Total</dt>
                <dd className="mt-1 text-sm font-medium text-blue-700 sm:mt-0 sm:col-span-2">
                  RS{booking.totalPrice}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal and contact details</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.fullName}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.phone}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Special requests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.specialRequests || 'None'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Airport Transfer Booking Section */}
      {airportTransferBooking && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Airport Transfer Booking</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Linked to excursion booking #{booking.bookingReference}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={airportTransferBooking.status} />
              <span className="text-sm text-gray-500">
                Ref: {airportTransferBooking.bookingReference || 'N/A'}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Transfer Service</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {airportTransferBooking.transfer?.airportName || 'Airport Transfer'}
                  {airportTransferBooking.transfer?.airportCode && (
                    <span className="ml-2 text-gray-500">({airportTransferBooking.transfer.airportCode})</span>
                  )}
                  {airportTransferBooking.transfer?.vehicleType && (
                    <span className="ml-2 text-gray-500">• {airportTransferBooking.transfer.vehicleType}</span>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Trip Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getTripTypeDisplay(airportTransferBooking.tripType)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Transfer Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {getTransferTypeDisplay(airportTransferBooking.transferType)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Arrival Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(airportTransferBooking.arrivalDate)} at {formatTime(airportTransferBooking.arrivalTime)}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Flight Number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {airportTransferBooking.flightNumber || 'Not specified'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Passengers</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {airportTransferBooking.passengers || booking.guests} passengers
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Transfer Price</dt>
                <dd className="mt-1 text-sm font-medium text-green-700 sm:mt-0 sm:col-span-2">
                  RS{airportTransferBooking.totalPrice || airportTransferBooking.price || '0.00'}
                </dd>
              </div>
              {airportTransferBooking.specialRequests && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Transfer Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                    {airportTransferBooking.specialRequests}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Additional Booking Details */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Price Summary</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* Activity Pricing Information */}
            {booking.activity && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Excursion Pricing</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium">Base Price:</span> RS{booking.activity.price}
                    </div>
                    {booking.activity.halfDayPrice && (
                      <div>
                        <span className="font-medium">Half Day:</span> RS{booking.activity.halfDayPrice}
                      </div>
                    )}
                    {booking.activity.fullDayPrice && (
                      <div>
                        <span className="font-medium">Full Day:</span> RS{booking.activity.fullDayPrice}
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}
            
            {/* Booking Calculation Details */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Price Calculation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Excursions price per person:</span>
                    <span>{pricePerPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of guests:</span>
                    <span>{booking.guests}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Excursions Subtotal:</span>
                    <span className="text-blue-700">RS{booking.totalPrice}</span>
                  </div>
                  
                  {/* Airport Transfer Price */}
                  {airportTransferBooking && (
                    <>
                      <div className="flex justify-between pt-2">
                        <span>Airport Transfer ({getTripTypeDisplay(airportTransferBooking.tripType)}):</span>
                        <span className="text-green-600">
                          RS{airportTransferBooking.totalPrice || airportTransferBooking.price || '0.00'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 pl-4">
                        {getTransferTypeDisplay(airportTransferBooking.transferType)} • {airportTransferBooking.passengers || booking.guests} passengers
                      </div>
                    </>
                  )}
                  
                  {/* Grand Total */}
                  <div className="flex justify-between font-bold text-lg pt-4 border-t-2">
                    <span>GRAND TOTAL:</span>
                    <span className="text-blue-800">RS{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

     {/* Action Buttons */}
<div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
  <div className="px-4 py-5 sm:p-6">
    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Booking Actions</h3>

    <div className="space-y-4">
      {/* Activity Booking Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Excursions Booking Status</h4>
        <div className="flex flex-wrap gap-2">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={updating}
                className={`inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Processing...' : 'Confirm Activity'}
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? '...' : 'Cancel'}
              </button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={updating}
                className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? '...' : 'Revert to Pending'}
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? '...' : 'Cancel Activity'}
              </button>
            </>
          )}

          {booking.status === 'cancelled' && (
            <>
              <button
                onClick={() => handleStatusChange('confirmed')}
                disabled={updating}
                className={`inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? 'Processing...' : 'Reactivate Activity'}
              </button>
              <button
                onClick={() => handleStatusChange('pending')}
                disabled={updating}
                className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updating ? '...' : 'Revert to Pending'}
              </button>
            </>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Current status: <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Airport Transfer Actions */}
      {airportTransferBooking && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Airport Transfer Booking Status</h4>
          <div className="flex flex-wrap gap-2">
            {airportTransferBooking.status === 'pending' && (
              <>
                <button
                  onClick={() => handleAirportTransferStatusChange('confirmed')}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Confirm Transfer'}
                </button>
                <button
                  onClick={() => handleAirportTransferStatusChange('cancelled')}
                  disabled={updating}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : 'Cancel Transfer'}
                </button>
              </>
            )}

            {airportTransferBooking.status === 'confirmed' && (
              <>
                <button
                  onClick={() => handleAirportTransferStatusChange('completed')}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Mark as Paid / Completed'}
                </button>
                <button
                  onClick={() => handleAirportTransferStatusChange('pending')}
                  disabled={updating}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : 'Revert to Pending'}
                </button>
                <button
                  onClick={() => handleAirportTransferStatusChange('cancelled')}
                  disabled={updating}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : 'Cancel Transfer'}
                </button>
              </>
            )}

            {airportTransferBooking.status === 'cancelled' && (
              <>
                <button
                  onClick={() => handleAirportTransferStatusChange('confirmed')}
                  disabled={updating}
                  className={`inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? 'Processing...' : 'Reactivate Transfer'}
                </button>
                <button
                  onClick={() => handleAirportTransferStatusChange('pending')}
                  disabled={updating}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : 'Revert to Pending'}
                </button>
              </>
            )}

            {airportTransferBooking.status === 'completed' && (
              <>
                <button
                  onClick={() => handleAirportTransferStatusChange('confirmed')}
                  disabled={updating}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : 'Revert to Confirmed but not paid'}
                </button>
                <button
                  onClick={() => handleAirportTransferStatusChange('cancelled')}
                  disabled={updating}
                  className={`inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-300 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : 'Cancel Transfer'}
                </button>
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Current status: <StatusBadge status={airportTransferBooking.status} />
          </div>
        </div>
      )}
    </div>

    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h5 className="text-sm font-medium text-blue-800 mb-2">Status Management Notes:</h5>
      <ul className="text-xs text-blue-700 space-y-1">
        <li>• <span className="font-medium">Pending</span>: New booking, needs review</li>
        <li>• <span className="font-medium">Confirmed</span>: Booking is confirmed and ready for payment</li>
        <li>• <span className="font-medium">Cancelled</span>: Booking has been cancelled</li>
        <li>• <span className="font-medium">Completed</span>: Both has been paid </li>
        <li>• You can revert to any previous status if changed accidentally</li>
      </ul>
    </div>

    {error && (
      <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    )}
  </div>
</div>
    </AdminLayout>
  );
};

export default BookingDetail;