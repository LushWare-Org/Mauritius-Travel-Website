import React, { useState, useEffect } from 'react';
import { airportTransferBookingAPI } from '../../utils/airportTransferApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { jsPDF } from 'jspdf';
import logo from '../../assets/logo.png'; // Import your logo

const UserAirportTransfers = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [contactAdminInfo, setContactAdminInfo] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showLinkedTransfers, setShowLinkedTransfers] = useState(false);

  // Load logo as base64
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Convert logo to base64
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
        setImageLoaded(true); // Continue even if logo fails
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await airportTransferBookingAPI.getUserBookings();

      if (response.data.success) {
        // Filter out transfers that are linked with activities
        const filteredBookings = response.data.data.filter((booking) => {
          // If toggle is ON, show all transfers
          if (showLinkedTransfers) {
            return true;
          }

          // Check for various patterns that indicate activity linkage

          // 1. Check special requests for booking references
          if (booking.specialRequests) {
            const specialRequests = booking.specialRequests.toLowerCase();

            // Common patterns indicating activity linkage
            if (
              specialRequests.includes('booking ref:') ||
              specialRequests.includes('booking reference:') ||
              specialRequests.includes('activity booking:') ||
              specialRequests.includes('activity ref:') ||
              specialRequests.includes('linked to') ||
              specialRequests.includes('combined with') ||
              specialRequests.match(/[a-z]{3}-[0-9]{6}/) || // Pattern like abc-123456
              specialRequests.match(/act-\d+/i) || // Pattern like ACT-123
              specialRequests.match(/booking\s*#?\s*[a-z0-9-]+/i) // Booking # pattern
            ) {
              return false; // Skip this booking (it's linked to an activity)
            }
          }

          // 2. Check for dedicated activity booking reference fields
          if (booking.activityBookingReference || booking.activityBookingId) {
            return false; // Skip this booking (it's linked to an activity)
          }

          // 3. Check for patterns in booking reference itself
          if (booking.bookingReference) {
            // If booking reference starts with ACT- (activity) or similar pattern
            if (
              booking.bookingReference.startsWith('ACT-') ||
              booking.bookingReference.startsWith('AB-') ||
              booking.bookingReference.includes('-ACT-')
            ) {
              return false;
            }
          }

          // 4. Check if transfer has an associated activity
          if (booking.activityId || booking.linkedActivityId) {
            return false;
          }

          // 5. Return true for standalone airport transfers
          return true;
        });

        console.log('Filtered airport transfers:', {
          total: response.data.data.length,
          standalone: filteredBookings.length,
          linked: response.data.data.length - filteredBookings.length,
        });

        setBookings(filteredBookings);
      } else {
        setError('Failed to load your airport transfers');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load your airport transfers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLinkedTransfers = () => {
    setShowLinkedTransfers(!showLinkedTransfers);
  };

  // Re-fetch when toggle changes
  useEffect(() => {
    if (!loading) {
      fetchUserBookings();
    }
  }, [showLinkedTransfers]);

  const generatePDF = (booking) => {
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
    doc.text('Airport Transfer Services', pageWidth / 2, 30, {
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
    doc.text(
      `Airport: ${booking.transfer?.airportName || 'N/A'} (${
        booking.transfer?.airportCode || 'N/A'
      })`,
      20,
      125
    );
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

    // Add transfer type
    doc.text(
      `Transfer Type: ${getTransferTypeText(booking.transferType)}`,
      20,
      160
    );

    // Add flight information if available
    if (booking.flightNumber) {
      doc.text(`Flight Number: ${booking.flightNumber}`, 20, 167);
    }

    // Payment Details Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', 20, booking.flightNumber ? 185 : 180);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const paymentY = booking.flightNumber ? 195 : 190;
    doc.text(`Total Amount: Rs${booking.totalPrice || 0}`, 20, paymentY);
    doc.text(
      `Status: ${booking.status?.toUpperCase() || 'COMPLETED'}`,
      20,
      paymentY + 7
    );
    doc.text(`Payment Date: ${formatDate(new Date())}`, 20, paymentY + 14);

    // Add special notes section
    if (booking.specialRequests || booking.adminNotes) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const notesY = booking.flightNumber ? 220 : 215;
      doc.text('ADDITIONAL NOTES', 20, notesY);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const notes = booking.specialRequests || booking.adminNotes || '';
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
      doc.text(splitNotes, 20, notesY + 10);
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
    doc.save(`booking-${booking.bookingReference}.pdf`);
  };

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

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800',
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

  const handleCancelBooking = async (bookingId, bookingReference) => {
    // Show contact admin information instead of actual cancellation
    setContactAdminInfo({
      bookingReference,
      message: 'To cancel this booking, please contact our admin team.',
    });

    // Auto-hide after 8 seconds
    setTimeout(() => {
      setContactAdminInfo(null);
    }, 8000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            My Airport Transfers
          </h2>
          <p className="text-gray-600">
            View and manage your airport transfer bookings
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {showLinkedTransfers ? (
              <span>
                Showing ALL airport transfers (including those linked to
                activities)
              </span>
            ) : (
              <span>
                Showing only standalone airport transfers (excluding those
                linked to activities)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Admin Info Message */}
      {contactAdminInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-info-circle text-blue-400"></i>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Contact Admin for Cancellation
              </p>

              <p className="text-xs text-gray-500 mb-2">
                Booking reference:
                <span className="ml-1 font-medium text-gray-700">
                  {contactAdminInfo.bookingReference}
                </span>
              </p>

              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {contactAdminInfo.message}
              </p>

              <div className="flex gap-3">
                <a
                  href="mailto:Mervbn01@gmail.com?subject=Cancellation Request"
                  className="inline-flex items-center gap-2 px-3 py-1.5
              text-sm font-medium text-gray-700
              border border-gray-300 rounded-md
              hover:bg-gray-100 transition"
                >
                  <i className="fas fa-envelope text-gray-500"></i>
                  Email Admin
                </a>

                <a
                  href="tel:+23058137644"
                  className="inline-flex items-center gap-2 px-3 py-1.5
              text-sm font-medium text-gray-700
              border border-gray-300 rounded-md
              hover:bg-gray-100 transition"
                >
                  <i className="fas fa-phone text-gray-500"></i>
                  Call Admin
                </a>
              </div>
            </div>

            <div className="ml-auto pl-3">
              <button
                onClick={() => setContactAdminInfo(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <i className="fas fa-plane-slash text-gray-300 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No airport transfer bookings
          </h3>
          <p className="text-gray-500 mb-4">
            {showLinkedTransfers
              ? "You haven't made any airport transfers (including linked ones)."
              : "You haven't made any standalone airport transfers."}
          </p>
          <a
            href="/airport-transfers"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <i className="fas fa-plane mr-2"></i>
            Book Airport Transfer
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white rounded-lg shadow border p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {booking.transfer?.airportName} (
                    {booking.transfer?.airportCode}) Transfer
                  </h3>
                  <p className="text-sm text-gray-500">
                    Booking Reference: {booking.bookingReference}
                  </p>
                  {/* Indicator for linked transfers (when toggle is ON) */}
                  {showLinkedTransfers && (
                    <div className="mt-2">
                      {(() => {
                        // Check if this transfer is linked to an activity
                        const isLinked =
                          (booking.specialRequests &&
                            (booking.specialRequests.includes('Booking Ref:') ||
                              booking.specialRequests.match(
                                /[A-Z]{3}-[0-9]{6}/
                              ))) ||
                          booking.activityBookingReference ||
                          booking.activityBookingId;

                        if (isLinked) {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              Linked to Activity
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(booking.status)}
                  <span className="text-lg font-bold text-gray-900">
                    Rs{booking.totalPrice}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Trip Type</p>
                  <p className="font-medium capitalize">
                    {booking.tripType.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transfer Type</p>
                  <p className="font-medium">
                    {getTransferTypeText(booking.transferType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium capitalize">
                    {booking.transfer?.vehicleType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hotel Name</p>
                  <p className="font-medium">
                    {booking.transfer?.airportCode || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Arrival</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(booking.arrivalDate)} · {booking.arrivalTime}
                  </p>

                  {booking.flightNumber && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Flight {booking.flightNumber}
                    </p>
                  )}
                </div>

                {booking.departureDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Departure</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(booking.departureDate)} ·{' '}
                      {booking.departureTime}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View Details
                  </button>

                  {/* Show Download PDF button for completed bookings */}
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => generatePDF(booking)}
                      disabled={!imageLoaded}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center disabled:opacity-50"
                      title="Download Receipt PDF"
                    >
                      <i className="fas fa-file-pdf mr-1"></i>
                      Download PDF
                    </button>
                  )}

                  {/* Show Cancel button for cancellable statuses */}
                  {(booking.status === 'pending' ||
                    booking.status === 'confirmed') && (
                    <button
                      onClick={() =>
                        handleCancelBooking(
                          booking._id,
                          booking.bookingReference
                        )
                      }
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
                    >
                      <i className="fas fa-times-circle mr-1"></i>
                      Cancel
                    </button>
                  )}

                  {/* For completed/cancelled bookings, show disabled button */}
                  {(booking.status === 'cancelled' ||
                    booking.status === 'rejected') && (
                    <button
                      disabled
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded-md cursor-not-allowed flex items-center"
                    >
                      <i className="fas fa-ban mr-1"></i>
                      {booking.status === 'cancelled'
                        ? 'Cancelled'
                        : 'Cannot Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Booking Details
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Reference */}
                <div>
                  <p className="text-xs text-gray-500">Booking Reference</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedBooking.bookingReference}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>

                {/* Transfer Service */}
                <div>
                  <p className="text-xs text-gray-500">Transfer Service</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedBooking.transfer?.airportName} (
                    {selectedBooking.transfer?.airportCode})
                  </p>
                </div>

                {/* Contact Info */}
                <div>
                  <p className="text-xs text-gray-500">Contact Information</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedBooking.guestName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedBooking.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedBooking.phone}
                  </p>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div>
                    <p className="text-xs text-gray-500">Special Requests</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedBooking.adminNotes && (
                  <div>
                    <p className="text-xs text-gray-500">Admin Notes</p>
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2 mt-1">
                      {selectedBooking.adminNotes}
                    </p>
                  </div>
                )}

                {/* PDF Download */}
                {selectedBooking.status === 'completed' && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-800 mb-3 flex items-center gap-2">
                      <i className="fas fa-file-pdf"></i>
                      Booking confirmation receipt
                    </p>

                    <button
                      onClick={() => {
                        generatePDF(selectedBooking);
                        setSelectedBooking(null);
                      }}
                      disabled={!imageLoaded}
                      className="w-full flex items-center justify-center gap-2
                   px-4 py-2.5 text-sm font-medium
                   bg-green-600 text-white rounded-md
                   hover:bg-green-700 transition
                   disabled:opacity-50"
                    >
                      <i className="fas fa-download"></i>
                      Download PDF
                    </button>
                  </div>
                )}

                {/* Cancel */}
                {(selectedBooking.status === 'pending' ||
                  selectedBooking.status === 'confirmed') && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm text-gray-700 mb-4 flex items-start gap-2">
                      <i className="fas fa-info-circle text-gray-400 mt-0.5"></i>
                      <span>
                        Cancellation requests must be handled by our admin team.
                      </span>
                    </p>

                    <button
                      onClick={() => {
                        handleCancelBooking(
                          selectedBooking._id,
                          selectedBooking.bookingReference
                        );
                        setSelectedBooking(null);
                      }}
                      className="w-full py-2.5 text-sm font-medium
                   text-red-600 border border-red-300 rounded-md
                   hover:bg-red-50 transition"
                    >
                      Contact Admin
                    </button>
                  </div>
                )}

                {/* Close */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-full py-2.5 rounded-md
                 text-sm font-medium text-gray-700
                 border border-gray-300
                 hover:bg-gray-100 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Policy Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 p-3 rounded-full">
              <i className="fas fa-info-circle text-blue-600 text-xl"></i>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Cancellation Policy
            </h3>
            <ul className="text-blue-600 text-sm space-y-2">
              <li className="flex items-start">
                <i className="fas fa-exclamation-circle text-blue-500 mt-0.5 mr-2"></i>
                <span>
                  <strong>All Bookings:</strong> Please contact admin for
                  cancellation requests
                </span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone text-green-500 mt-0.5 mr-2"></i>
                <span>
                  <strong>Contact:</strong> Call +230 5813 7644 or email
                  Mervbn01@gmail.com
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAirportTransfers;
