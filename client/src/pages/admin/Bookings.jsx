import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { bookingsAPI, airportTransferBookingAPI } from '../../utils/api';
import { saveAs } from 'file-saver';
import logo from '../../assets/logo.png';

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

  // Enhanced filtering state
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // PDF generation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [reportType, setReportType] = useState('pdf');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Months array for filter
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Get current year and last 5 years for filter
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
    if (statusParam) {
      setSelectedStatus(statusParam);
    }

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
        const sortedBookings = bookingsResponse.data.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setBookings(sortedBookings);
      } else {
        setError('Failed to fetch activity bookings');
      }

      if (airportBookingsResponse.data.success) {
        setAirportTransferBookings(airportBookingsResponse.data.data);
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to find airport transfer booking for a specific activity booking
  const findAirportTransferForBooking = (bookingReference) => {
    return airportTransferBookings.find((transfer) =>
      transfer.specialRequests?.includes(bookingReference)
    );
  };

  // Calculate total price including airport transfer
  const getTotalPriceWithTransfer = (booking) => {
    const airportTransfer = findAirportTransferForBooking(
      booking.bookingReference
    );
    let total = booking.totalPrice || 0;

    if (airportTransfer) {
      total += parseFloat(
        airportTransfer.totalPrice || airportTransfer.price || 0
      );
    }

    return total;
  };

  // Get airport transfer price
  const getAirportTransferPrice = (booking) => {
    const airportTransfer = findAirportTransferForBooking(
      booking.bookingReference
    );
    return airportTransfer
      ? parseFloat(airportTransfer.totalPrice || airportTransfer.price || 0)
      : 0;
  };

  // Check if booking has airport transfer
  const hasAirportTransfer = (booking) => {
    return !!findAirportTransferForBooking(booking.bookingReference);
  };

  // Enhanced filtering function
  const getFilteredBookings = () => {
    return bookings.filter((booking) => {
      const matchesSearch =
        (booking.activity?.title || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingReference
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || booking.status === selectedStatus;

      let matchesDate = true;
      const bookingDate = new Date(booking.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeekStart = new Date(today);
      nextWeekStart.setDate(today.getDate() + 7);

      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 7);

      const thisMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      switch (selectedDateFilter) {
        case 'today':
          matchesDate = bookingDate.setHours(0, 0, 0, 0) === today.getTime();
          break;
        case 'tomorrow':
          matchesDate = bookingDate.setHours(0, 0, 0, 0) === tomorrow.getTime();
          break;
        case 'thisWeek':
          matchesDate = bookingDate >= today && bookingDate < nextWeekStart;
          break;
        case 'nextWeek':
          matchesDate =
            bookingDate >= nextWeekStart && bookingDate < nextWeekEnd;
          break;
        case 'thisMonth':
          matchesDate = bookingDate >= today && bookingDate <= thisMonthEnd;
          break;
        default:
          matchesDate = true;
      }

      let matchesMonth = true;
      if (selectedMonth !== 'all') {
        const bookingMonth = bookingDate.getMonth() + 1;
        matchesMonth = String(bookingMonth).padStart(2, '0') === selectedMonth;
      }

      let matchesYear = true;
      if (selectedYear !== 'all') {
        matchesYear = bookingDate.getFullYear() === parseInt(selectedYear);
      }

      let matchesDateRange = true;
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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate &&
        matchesMonth &&
        matchesYear &&
        matchesDateRange
      );
    });
  };

  const filteredBookings = getFilteredBookings();

  useEffect(() => {
    setTotalPages(Math.ceil(filteredBookings.length / itemsPerPage));
    if (
      currentPage > Math.ceil(filteredBookings.length / itemsPerPage) &&
      Math.ceil(filteredBookings.length / itemsPerPage) > 0
    ) {
      setCurrentPage(1);
    }
  }, [filteredBookings, itemsPerPage]);

  const getCurrentPageBookings = () => {
    const indexOfLastBooking = currentPage * itemsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
    return filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateForCSV = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-CA', options); // YYYY-MM-DD format
  };

  const getDurationTypeDisplay = (booking) => {
    if (booking.durationType) {
      return booking.durationType;
    }

    if (booking.duration === 'halfDay') {
      return 'Half Day';
    } else if (booking.duration === 'fullDay') {
      return 'Full Day';
    }

    if (booking.activity?.pricingType === 'half-full-day') {
      if (booking.pricePerPerson && booking.activity) {
        if (booking.pricePerPerson === booking.activity.halfDayPrice) {
          return 'Half Day';
        } else if (booking.pricePerPerson === booking.activity.fullDayPrice) {
          return 'Full Day';
        }
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
      type:
        transfer.transferType === 'airport-to-hotel'
          ? 'Airport → Hotel'
          : 'Hotel → Airport',
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
        case 'confirmed':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pending':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'cancelled':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'completed':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(
          status
        )}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
            status === 'confirmed' || status === 'completed'
              ? 'bg-blue-600'
              : 'bg-gray-600'
          }`}
        ></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const response = await bookingsAPI.updateStatus(bookingId, newStatus);
      if (response.data.success) {
        setBookings(
          bookings.map((booking) =>
            booking._id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedDateFilter('all');
    setSelectedMonth('all');
    setSelectedYear('all');
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  // PDF Report Generation Functions
  const openReportModal = () => {
    setShowReportModal(true);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setReportDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    });
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setGeneratingReport(false);
    setReportError('');
  };

  const getReportData = () => {
    const { startDate, endDate } = reportDateRange;
    if (!startDate || !endDate) {
      return filteredBookings;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return filteredBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= start && bookingDate <= end;
    });
  };

  // Generate professional PDF with landscape orientation
  const generatePDF = async () => {
    try {
      setGeneratingReport(true);
      setReportError('');

      const { jsPDF } = await import('jspdf');
      const reportData = getReportData();

      if (reportData.length === 0) {
        setReportError('No data found for the selected date range');
        setGeneratingReport(false);
        return;
      }

      // Create PDF in LANDSCAPE orientation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPos = margin;

      // Add header with blue background
      doc.setFillColor(0, 112, 192); // Blue color
      doc.rect(0, 0, pageWidth, 20, 'F');

      // Add logo to the PDF
      let logoAdded = false;
      try {
        // Create an image element
        const img = new Image();
        img.src = logo;

        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load logo'));
        });

        // Add logo to PDF
        const logoWidth = 18;
        const logoHeight = (img.height * logoWidth) / img.width;
        const logoX = margin;
        const logoY = 2;

        // Convert image to data URL
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const logoDataURL = canvas.toDataURL('image/jpeg');

        doc.addImage(logoDataURL, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        logoAdded = true;
      } catch (logoError) {
        console.warn('Could not load logo for PDF:', logoError);
        // Continue without logo if there's an error
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');

      // Adjust text position based on logo presence
      const textStartX = logoAdded ? margin + 25 : margin;
      doc.text('Holiday Vibes', textStartX, 12);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Comprehensive Booking Report - Landscape View', textStartX, 18);

      // Report details
      yPos = 25;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(
        `Report Period: ${formatDate(
          reportDateRange.startDate
        )} to ${formatDate(reportDateRange.endDate)}`,
        margin,
        yPos
      );
      yPos += 5;
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        margin,
        yPos
      );
      yPos += 5;
      doc.text(`Total Records: ${reportData.length}`, margin, yPos);
      yPos += 8;

      // Summary statistics
      const totalRevenue = reportData.reduce(
        (sum, booking) => sum + getTotalPriceWithTransfer(booking),
        0
      );
      const confirmedCount = reportData.filter(
        (b) => b.status === 'confirmed'
      ).length;
      const pendingCount = reportData.filter(
        (b) => b.status === 'pending'
      ).length;
      const cancelledCount = reportData.filter(
        (b) => b.status === 'cancelled'
      ).length;
      const withTransferCount = reportData.filter((b) =>
        hasAirportTransfer(b)
      ).length;
      const transferRevenue = reportData.reduce(
        (sum, booking) => sum + getAirportTransferPrice(booking),
        0
      );
      const activityRevenue = totalRevenue - transferRevenue;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics:', margin, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');

      // Summary data - 2 columns (more space in landscape)
      const summaryDataLeft = [
        ['Total Bookings', reportData.length.toString()],
        ['Confirmed Bookings', confirmedCount.toString()],
        ['Pending Bookings', pendingCount.toString()],
        ['Cancelled Bookings', cancelledCount.toString()],
        ['With Airport Transfer', withTransferCount.toString()],
      ];

      const summaryDataRight = [
        ['Activity Revenue', `$${activityRevenue.toFixed(2)}`],
        ['Transfer Revenue', `$${transferRevenue.toFixed(2)}`],
        ['Total Revenue', `$${totalRevenue.toFixed(2)}`],
        [
          'Avg. Booking Value',
          `$${
            reportData.length > 0
              ? (totalRevenue / reportData.length).toFixed(2)
              : '0.00'
          }`,
        ],
        [
          'Transfer Rate',
          reportData.length > 0
            ? `${((withTransferCount / reportData.length) * 100).toFixed(1)}%`
            : '0%',
        ],
      ];

      // Draw summary boxes - wider in landscape
      const boxWidth = (pageWidth - margin * 3) / 2;
      const boxHeight = 35;
      const summaryRowHeight = 6;

      // Left summary box
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, boxWidth, boxHeight, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Booking Metrics', margin + 10, yPos + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      let summaryY = yPos + 12;
      summaryDataLeft.forEach((row, index) => {
        doc.text(`${row[0]}:`, margin + 10, summaryY);
        doc.text(row[1], margin + boxWidth - 10, summaryY, { align: 'right' });
        summaryY += summaryRowHeight;
      });

      // Right summary box
      doc.setFillColor(240, 240, 240);
      doc.rect(margin * 2 + boxWidth, yPos, boxWidth, boxHeight, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', margin * 2 + boxWidth + 10, yPos + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      summaryY = yPos + 12;
      summaryDataRight.forEach((row, index) => {
        doc.text(`${row[0]}:`, margin * 2 + boxWidth + 10, summaryY);
        doc.text(row[1], margin * 2 + boxWidth + boxWidth - 10, summaryY, {
          align: 'right',
        });
        summaryY += summaryRowHeight;
      });

      yPos += boxHeight + 10;

      // Detailed bookings table - Landscape orientation with more columns
      if (yPos > pageHeight - 40) {
        doc.addPage('landscape');
        yPos = margin;
      }

      // Table headers - More detailed columns in landscape
      const headers = [
        'Booking ID',
        'Activity',
        'Customer',
        'Email',
        'Date',
        'Guests',
        'Excursion Price',
        'Has Transfer',
        'Transfer Price',
        'Total Price',
        'Status',
      ];

      // Column widths for landscape orientation (wider)
      const colWidths = [25, 35, 30, 40, 25, 15, 25, 20, 25, 25, 20];

      // Adjust if total width exceeds page
      const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
      const availableWidth = pageWidth - margin * 2;
      if (totalTableWidth > availableWidth) {
        const scaleFactor = availableWidth / totalTableWidth;
        colWidths.forEach((width, index) => {
          colWidths[index] = Math.floor(width * scaleFactor);
        });
      }

      let currentX = margin;

      // Draw table header
      doc.setFillColor(0, 112, 192);
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      headers.forEach((header, i) => {
        const colCenter = currentX + colWidths[i] / 2;
        doc.text(header, colCenter, yPos + 5, { align: 'center' });
        currentX += colWidths[i];
      });

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      // Draw table rows with pagination
      let rowIndex = 0;
      const tableRowHeight = 7;
      const maxRowsPerPage = Math.floor(
        (pageHeight - yPos - 20) / tableRowHeight
      );

      for (let i = 0; i < reportData.length; i++) {
        // Check if we need a new page
        if (rowIndex >= maxRowsPerPage) {
          doc.addPage('landscape');
          yPos = margin;
          rowIndex = 0;

          // Draw header for new page
          doc.setFillColor(0, 112, 192);
          doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');

          currentX = margin;
          headers.forEach((header, h) => {
            const colCenter = currentX + colWidths[h] / 2;
            doc.text(header, colCenter, yPos + 5, { align: 'center' });
            currentX += colWidths[h];
          });

          yPos += 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }

        const booking = reportData[i];
        const transferDetails = getAirportTransferDetails(booking);
        const totalWithTransfer = getTotalPriceWithTransfer(booking);
        const transferPrice = getAirportTransferPrice(booking);
        const hasTransfer = hasAirportTransfer(booking);

        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos, pageWidth - margin * 2, tableRowHeight, 'F');
        }

        doc.setTextColor(0, 0, 0);

        // Draw row data
        currentX = margin;

        const rowData = [
          booking.bookingReference.substring(0, 10) +
            (booking.bookingReference.length > 10 ? '...' : ''),
          (booking.activity?.title || 'N/A').substring(0, 20) +
            ((booking.activity?.title?.length || 0) > 20 ? '...' : ''),
          booking.fullName.substring(0, 15) +
            (booking.fullName.length > 15 ? '...' : ''),
          booking.email.substring(0, 20) +
            (booking.email.length > 20 ? '...' : ''),
          formatDate(booking.date),
          booking.guests?.toString() || '1',
          `$${booking.totalPrice?.toFixed(2) || '0.00'}`,
          hasTransfer ? 'Yes' : 'No',
          hasTransfer ? `$${transferPrice.toFixed(2)}` : '-',
          `$${totalWithTransfer.toFixed(2)}`,
          booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
        ];

        rowData.forEach((cell, cellIndex) => {
          const colCenter = currentX + colWidths[cellIndex] / 2;
          doc.text(cell.toString(), colCenter, yPos + 4, { align: 'center' });
          currentX += colWidths[cellIndex];
        });

        yPos += tableRowHeight;
        rowIndex++;

        // Add additional transfer details if available (more space in landscape)
        if (transferDetails && rowIndex + 2 < maxRowsPerPage) {
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(7);

          const transferInfo = [
            `Type: ${transferDetails.type}`,
            `Trip: ${transferDetails.tripType}`,
            `Status: ${
              transferDetails.status.charAt(0).toUpperCase() +
              transferDetails.status.slice(1)
            }`,
          ];

          if (transferDetails.pickupDate) {
            transferInfo.push(
              `Pickup: ${formatDate(transferDetails.pickupDate)} ${
                transferDetails.pickupTime || ''
              }`
            );
          }
          if (transferDetails.flightNumber) {
            transferInfo.push(`Flight: ${transferDetails.flightNumber}`);
          }

          const detailsString = transferInfo.join(' | ');
          doc.text(`Transfer Details: ${detailsString}`, margin + 5, yPos + 4);

          yPos += tableRowHeight;
          rowIndex++;
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
        }
      }

      // Add page numbers and footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);

        // Page number at bottom right
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 5);

        // Report ID at bottom left
        doc.text(
          `Report ID: ${Date.now().toString().slice(-8)}`,
          margin,
          pageHeight - 5
        );

        // Company name at bottom center
        doc.text(
          'Holiday Vibes - Booking Management System',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );

        // Report date at bottom
        doc.text(
          `Report Period: ${formatDate(
            reportDateRange.startDate
          )} - ${formatDate(reportDateRange.endDate)}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`holiday-vibes-bookings-landscape-${timestamp}.pdf`);

      setGeneratingReport(false);
      closeReportModal();
    } catch (error) {
      console.error('Error generating PDF:', error);
      setReportError('Failed to generate PDF report. Please try again.');
      setGeneratingReport(false);
    }
  };

  const generateCSV = () => {
    try {
      setGeneratingReport(true);
      setReportError('');

      const reportData = getReportData();

      // CSV headers with all columns
      const headers = [
        'Booking Reference',
        'Activity Title',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Booking Date',
        'Activity Date',
        'Number of Guests',
        'Duration Type',
        'Activity Price',
        'Total Activity Price',
        'Has Airport Transfer',
        'Transfer Status',
        'Transfer Type',
        'Trip Type',
        'Transfer Price',
        'Pickup Date',
        'Pickup Time',
        'Flight Number',
        'Transfer Passengers',
        'Pickup Location',
        'Dropoff Location',
        'Total Price (Activity + Transfer)',
        'Booking Status',
        'Payment Status',
        'Special Requests',
        'Booking Created At',
      ];

      // CSV rows
      const rows = reportData.map((booking) => {
        const transferDetails = getAirportTransferDetails(booking);
        const totalWithTransfer = getTotalPriceWithTransfer(booking);
        const durationType = getDurationTypeDisplay(booking);
        const hasTransfer = hasAirportTransfer(booking);
        const transferPrice = getAirportTransferPrice(booking);

        return [
          booking.bookingReference,
          booking.activity?.title || '',
          booking.fullName,
          booking.email,
          booking.phone || '',
          formatDateForCSV(booking.createdAt || booking.date),
          formatDateForCSV(booking.date),
          booking.guests?.toString() || '1',
          durationType,
          booking.pricePerPerson
            ? `$${booking.pricePerPerson.toFixed(2)}`
            : '$0.00',
          `$${booking.totalPrice?.toFixed(2) || '0.00'}`,
          hasTransfer ? 'Yes' : 'No',
          transferDetails?.status || 'N/A',
          transferDetails?.type || 'N/A',
          transferDetails?.tripType || 'N/A',
          hasTransfer ? `$${transferPrice.toFixed(2)}` : '$0.00',
          transferDetails?.pickupDate
            ? formatDateForCSV(transferDetails.pickupDate)
            : 'N/A',
          transferDetails?.pickupTime || 'N/A',
          transferDetails?.flightNumber || 'N/A',
          transferDetails?.passengers?.toString() || '1',
          transferDetails?.pickupLocation || 'N/A',
          transferDetails?.dropoffLocation || 'N/A',
          `$${totalWithTransfer.toFixed(2)}`,
          booking.status,
          booking.paymentStatus || 'Not specified',
          booking.specialRequests || '',
          new Date(booking.createdAt || booking.date).toISOString(),
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `holiday-vibes-bookings-${timestamp}.csv`);

      setGeneratingReport(false);
      closeReportModal();
    } catch (error) {
      console.error('Error generating CSV:', error);
      setReportError('Failed to generate CSV report. Please try again.');
      setGeneratingReport(false);
    }
  };

  const generateReport = () => {
    if (reportType === 'pdf') {
      generatePDF();
    } else {
      generateCSV();
    }
  };

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
              Showing{' '}
              <span className="font-medium">
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredBookings.length
                )}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
              </span>{' '}
              of <span className="font-medium">{filteredBookings.length}</span>{' '}
              bookings
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
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
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                </>
              )}

              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`relative inline-flex items-center px-4 py-2 border ${
                    currentPage === number
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } text-sm font-medium`}
                >
                  {number}
                </button>
              ))}

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

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Stats component with blue theme
  const BookingStats = () => {
    const totalBookings = filteredBookings.length;
    const bookingsWithTransfer = filteredBookings.filter((booking) =>
      hasAirportTransfer(booking)
    ).length;
    const totalRevenue = filteredBookings.reduce((sum, booking) => {
      return sum + getTotalPriceWithTransfer(booking);
    }, 0);

    const avgRevenuePerBooking =
      totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const confirmedBookings = filteredBookings.filter(
      (b) => b.status === 'confirmed'
    ).length;
    const transferRevenue = filteredBookings.reduce((sum, booking) => {
      return sum + getAirportTransferPrice(booking);
    }, 0);
    const activityRevenue = totalRevenue - transferRevenue;

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
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
            <div className="ml-4">
              <p className="text-sm text-gray-600">Filtered Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalBookings}
              </p>
              <p className="text-xs text-gray-500">
                {bookings.length > 0
                  ? `${((totalBookings / bookings.length) * 100).toFixed(
                      1
                    )}% of total`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {confirmedBookings}
              </p>
              <p className="text-xs text-gray-500">
                {totalBookings > 0
                  ? `${((confirmedBookings / totalBookings) * 100).toFixed(
                      1
                    )}% confirmed`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
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
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">With Transfer</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookingsWithTransfer}
              </p>
              <p className="text-xs text-gray-500">
                {totalBookings > 0
                  ? `${((bookingsWithTransfer / totalBookings) * 100).toFixed(
                      1
                    )}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Activity: ${activityRevenue.toFixed(2)} | Transfer: $
                {transferRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg. Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${avgRevenuePerBooking.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Per booking</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Report Modal
  const ReportModal = () => {
    const reportData = getReportData();
    const reportDataCount = reportData.length;
    const totalRevenue = reportData.reduce(
      (sum, booking) => sum + getTotalPriceWithTransfer(booking),
      0
    );
    const transferRevenue = reportData.reduce(
      (sum, booking) => sum + getAirportTransferPrice(booking),
      0
    );
    const activityRevenue = totalRevenue - transferRevenue;
    const bookingsWithTransfer = reportData.filter((b) =>
      hasAirportTransfer(b)
    ).length;

    return (
      <div className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={closeReportModal}
          ></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
            &#8203;
          </span>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Generate Report
                    </h3>
                    <button
                      onClick={closeReportModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {reportError && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{reportError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Type
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setReportType('pdf')}
                          className={`p-3 border rounded-lg text-center ${
                            reportType === 'pdf'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <svg
                              className="h-8 w-8 mb-2 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-sm font-medium">
                              PDF Document
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              Landscape format (wide view)
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportType('csv')}
                          className={`p-3 border rounded-lg text-center ${
                            reportType === 'csv'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <svg
                              className="h-8 w-8 mb-2 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="text-sm font-medium">
                              CSV/Excel
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              Full data export
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={reportDateRange.startDate}
                            onChange={(e) =>
                              setReportDateRange((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                          />
                          <p className="mt-1 text-xs text-gray-500 text-center">
                            Start Date
                          </p>
                        </div>
                        <div>
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={reportDateRange.endDate}
                            onChange={(e) =>
                              setReportDateRange((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                          />
                          <p className="mt-1 text-xs text-gray-500 text-center">
                            End Date
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Report Summary
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">
                            Records Included:
                          </span>
                          <span className="font-medium text-blue-900">
                            {reportDataCount} bookings
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">
                            With Airport Transfer:
                          </span>
                          <span className="font-medium text-blue-900">
                            {bookingsWithTransfer} (
                            {reportDataCount > 0
                              ? (
                                  (bookingsWithTransfer / reportDataCount) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">
                            Activity Revenue:
                          </span>
                          <span className="font-medium text-blue-900">
                            ${activityRevenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">
                            Transfer Revenue:
                          </span>
                          <span className="font-medium text-blue-900">
                            ${transferRevenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Total Revenue:</span>
                          <span className="font-medium text-blue-900">
                            ${totalRevenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-700">Date Range:</span>
                          <span className="font-medium text-blue-900">
                            {reportDateRange.startDate &&
                            reportDateRange.endDate
                              ? `${formatDate(
                                  reportDateRange.startDate
                                )} - ${formatDate(reportDateRange.endDate)}`
                              : 'All dates'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg
                          className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Note:</strong>{' '}
                            {reportType === 'pdf'
                              ? 'PDF report uses landscape orientation for better table viewing. Includes logo and detailed booking information.'
                              : 'CSV file includes complete booking and transfer data for detailed analysis in spreadsheet applications.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={generateReport}
                disabled={generatingReport}
                className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                  generatingReport
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {generatingReport ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Generating Report...
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 -ml-1 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download {reportType.toUpperCase()} Report
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={closeReportModal}
                disabled={generatingReport}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="pb-5 border-b border-gray-200 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Bookings
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage all activity bookings including airport transfers
            </p>
          </div>
          <button
            onClick={openReportModal}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="mr-2 -ml-1 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Report
          </button>
        </div>
      </div>

      {/* Booking Stats */}
      <BookingStats />

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6 border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-7 mb-4">
            <div className="col-span-1 md:col-span-3">
              <label htmlFor="search" className="sr-only">
                Search Bookings
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by booking ID, activity, customer name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="statusFilter" className="sr-only">
                Filter by Status
              </label>
              <select
                id="statusFilter"
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="monthFilter" className="sr-only">
                Filter by Month
              </label>
              <select
                id="monthFilter"
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
            </div>

            <div>
              <label htmlFor="yearFilter" className="sr-only">
                Filter by Year
              </label>
              <select
                id="yearFilter"
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
            </div>

            <div>
              <label htmlFor="dateFilter" className="sr-only">
                Quick Date Filter
              </label>
              <select
                id="dateFilter"
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
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="mr-2 -ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {filteredBookings.length !== bookings.length && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <svg
                className="flex-shrink-0 mr-2 h-5 w-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Showing {filteredBookings.length} of {bookings.length} bookings
              {selectedStatus !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Status: {selectedStatus}
                </span>
              )}
              {selectedMonth !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Month: {months.find((m) => m.value === selectedMonth)?.label}
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Year: {selectedYear}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
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
        </div>
      )}

      {/* Bookings Table */}
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
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Booking ID
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Activity & Customer
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date & Details
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Pricing
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPageBookings().length > 0 ? (
                  getCurrentPageBookings().map((booking, index) => {
                    const durationType = getDurationTypeDisplay(booking);
                    const transferDetails = getAirportTransferDetails(booking);
                    const totalWithTransfer =
                      getTotalPriceWithTransfer(booking);
                    const transferPrice = getAirportTransferPrice(booking);
                    const hasTransfer = hasAirportTransfer(booking);

                    return (
                      <tr
                        key={booking._id}
                        className={`hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
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
                            {booking.paymentStatus ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs ${
                                  booking.paymentStatus === 'paid'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {booking.paymentStatus}
                              </span>
                            ) : (
                              'Payment: N/A'
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.activity?.title || 'Unknown Activity'}
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            {booking.fullName}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {booking.email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.phone || 'No phone'}
                          </div>
                          {booking.specialRequests && (
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Notes:</span>{' '}
                              {booking.specialRequests.substring(0, 50)}
                              {booking.specialRequests.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(booking.date)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Guests:</span>{' '}
                            {booking.guests || '1'}
                          </div>
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
                              ${totalWithTransfer.toFixed(2)}
                              {hasTransfer && (
                                <span className="text-xs text-blue-600 ml-1">
                                  (incl. transfer)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div>
                                Activity: $
                                {booking.totalPrice?.toFixed(2) || '0.00'}
                              </div>
                              {hasTransfer && (
                                <div className="text-blue-600">
                                  Transfer: +${transferPrice.toFixed(2)}
                                </div>
                              )}
                              {booking.guests && booking.guests > 1 && (
                                <div>
                                  $
                                  {(
                                    booking.totalPrice / booking.guests
                                  ).toFixed(2)}{' '}
                                  × {booking.guests} guests
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
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(
                                      booking._id,
                                      'confirmed'
                                    );
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(
                                      booking._id,
                                      'cancelled'
                                    );
                                  }}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(booking._id, 'cancelled');
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            )}
                            {booking.status === 'cancelled' && (
                              <button
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
                    <td
                      colSpan="6"
                      className="px-4 py-4 text-center text-sm text-gray-500"
                    >
                      No bookings found matching your filters.
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
              <span className="mr-3 text-xs text-gray-500">
                Items per page:
              </span>
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

      {/* Report Modal */}
      {showReportModal && <ReportModal />}
    </AdminLayout>
  );
};

export default AdminBookings;