import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { airportTransferBookingAPI } from '../../utils/airportTransferApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import logo from '../../assets/logo.png';

const AirportTransferBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    adminNotes: '',
  });
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [downloadType, setDownloadType] = useState('pdf'); // 'pdf' or 'csv'

  // Generate years (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const months = [
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

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, []);

  useEffect(() => {
    if (allBookings.length > 0) {
      applyFilters();
    }
  }, [allBookings, statusFilter, monthFilter, yearFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await airportTransferBookingAPI.getAllBookings();

      if (response.data.success) {
        const bookingsData = response.data.data;
        setAllBookings(bookingsData);
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

  const applyFilters = () => {
    let filtered = [...allBookings];
    let anyFilterApplied = false;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
      anyFilterApplied = true;
    }

    if (monthFilter && yearFilter) {
      filtered = filtered.filter((booking) => {
        if (!booking.arrivalDate) return false;
        const bookingDate = new Date(booking.arrivalDate);
        const bookingMonth = (bookingDate.getMonth() + 1)
          .toString()
          .padStart(2, '0');
        const bookingYear = bookingDate.getFullYear().toString();
        return bookingMonth === monthFilter && bookingYear === yearFilter;
      });
      anyFilterApplied = true;
    } else if (monthFilter && !yearFilter) {
      filtered = filtered.filter((booking) => {
        if (!booking.arrivalDate) return false;
        const bookingDate = new Date(booking.arrivalDate);
        const bookingMonth = (bookingDate.getMonth() + 1)
          .toString()
          .padStart(2, '0');
        const bookingYear = bookingDate.getFullYear().toString();
        return (
          bookingMonth === monthFilter && bookingYear === currentYear.toString()
        );
      });
      anyFilterApplied = true;
      setYearFilter(currentYear.toString());
    } else if (!monthFilter && yearFilter) {
      filtered = filtered.filter((booking) => {
        if (!booking.arrivalDate) return false;
        const bookingDate = new Date(booking.arrivalDate);
        const bookingYear = bookingDate.getFullYear().toString();
        return bookingYear === yearFilter;
      });
      anyFilterApplied = true;
    }

    setFiltersApplied(anyFilterApplied);
    setFilteredBookings(filtered);
    setBookings(filtered);
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

  const getFilteredBookingsForReport = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return allBookings;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    return allBookings.filter((booking) => {
      if (!booking.arrivalDate) return false;

      const bookingDate = new Date(booking.arrivalDate);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  };

  const generateCSVReport = () => {
    const bookingsData = getFilteredBookingsForReport();

    if (bookingsData.length === 0) {
      setError('No bookings found for the selected period');
      return;
    }

    const headers = [
      'Booking Reference',
      'Customer Name',
      'Email',
      'Phone',
      'Hotel Name',
      'Airport Name',
      'Vehicle Type',
      'Trip Type',
      'Arrival Date',
      'Flight Number',
      'Passengers',
      'Total Price',
      'Status',
      'Booking Date',
    ];

    const csvData = bookingsData.map((booking) => [
      booking.bookingReference || '',
      booking.guestName || '',
      booking.email || '',
      booking.phone || '',
      booking.transfer?.airportCode || 'N/A', // Hotel Name (using airportCode field)
      booking.transfer?.airportName || 'N/A', // Airport Name
      booking.transfer?.vehicleType || '',
      booking.tripType || '',
      formatDateForCSV(booking.arrivalDate),
      booking.flightNumber || '',
      booking.passengers || 0,
      booking.totalPrice || 0,
      booking.status || '',
      formatDateForCSV(booking.createdAt),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `airport-transfers-${dateRange.startDate}-to-${dateRange.endDate}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloadModalOpen(false);
    setDateRange({ startDate: '', endDate: '' });
  };

  const generatePDFReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setDownloadLoading(true);
      const bookingsData = getFilteredBookingsForReport();

      if (bookingsData.length === 0) {
        setError('No bookings found for the selected period');
        setDownloadLoading(false);
        return;
      }

      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const totalAmount = bookingsData.reduce(
        (sum, booking) => sum + (booking.totalPrice || 0),
        0
      );
      const totalBookings = bookingsData.length;

      const statusCounts = {};
      const vehicleTypeCounts = {};
      const airportCounts = {};
      const hotelCounts = {};
      const tripTypeCounts = {};

      bookingsData.forEach((booking) => {
        statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;

        const vehicleType = booking.transfer?.vehicleType || 'Unknown';
        vehicleTypeCounts[vehicleType] =
          (vehicleTypeCounts[vehicleType] || 0) + 1;

        const airport = booking.transfer?.airportName || 'Unknown';
        airportCounts[airport] = (airportCounts[airport] || 0) + 1;

        const hotel = booking.transfer?.airportCode || 'Unknown'; // Hotel Name
        hotelCounts[hotel] = (hotelCounts[hotel] || 0) + 1;

        const tripType = booking.tripType || 'Unknown';
        tripTypeCounts[tripType] = (tripTypeCounts[tripType] || 0) + 1;
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let currentPage = 1;
      const maxRowsPerPage = 25;
      const totalPages = Math.ceil(bookingsData.length / maxRowsPerPage);

      // Function to add header to each page
      const addPageHeader = (pageNumber) => {
        pdf.setFontSize(20);
        pdf.setTextColor(30, 64, 175);
        pdf.text('Holiday Vibes', 105, 15, { align: 'center' });

        pdf.setFontSize(12);
        pdf.setTextColor(102, 102, 102);
        pdf.text('Airport Transfer Bookings Report', 105, 22, {
          align: 'center',
        });

        pdf.setFontSize(8);
        pdf.text(
          `Period: ${formatDateForDisplay(
            dateRange.startDate
          )} - ${formatDateForDisplay(dateRange.endDate)}`,
          105,
          28,
          { align: 'center' }
        );
        pdf.text(
          `Generated: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          105,
          32,
          { align: 'center' }
        );
        pdf.text(`Page ${pageNumber} of ${totalPages}`, 105, 36, {
          align: 'center',
        });

        // Logo
        if (logo) {
          const img = new Image();
          img.src = logo;
          pdf.addImage(img, 'JPEG', 180, 10, 20, 20);
        }
      };

      // First page with summary
      addPageHeader(1);

      // Summary Cards
      const summaryYStart = 45;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(10, summaryYStart, 45, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('Total Bookings', 32.5, summaryYStart + 7, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(totalBookings.toString(), 32.5, summaryYStart + 14, {
        align: 'center',
      });

      pdf.setFillColor(16, 185, 129);
      pdf.rect(60, summaryYStart, 45, 20, 'F');
      pdf.setFontSize(8);
      pdf.text('Total Revenue', 82.5, summaryYStart + 7, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(`$${totalAmount.toFixed(2)}`, 82.5, summaryYStart + 14, {
        align: 'center',
      });

      pdf.setFillColor(139, 92, 246);
      pdf.rect(110, summaryYStart, 45, 20, 'F');
      pdf.setFontSize(8);
      pdf.text('Average Booking', 132.5, summaryYStart + 7, {
        align: 'center',
      });
      pdf.setFontSize(14);
      pdf.text(
        `$${
          totalBookings > 0 ? (totalAmount / totalBookings).toFixed(2) : '0.00'
        }`,
        132.5,
        summaryYStart + 14,
        { align: 'center' }
      );

      pdf.setFillColor(245, 158, 11);
      pdf.rect(160, summaryYStart, 45, 20, 'F');
      pdf.setFontSize(8);
      pdf.text('Days Covered', 182.5, summaryYStart + 7, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(
        calculateDaysBetween(dateRange.startDate, dateRange.endDate).toString(),
        182.5,
        summaryYStart + 14,
        { align: 'center' }
      );

      // Statistics Section
      let currentY = summaryYStart + 30;

      pdf.setTextColor(51, 51, 51);
      pdf.setFontSize(14);
      pdf.text('Statistics Summary', 10, currentY);
      currentY += 10;

      pdf.setDrawColor(221, 221, 221);
      pdf.line(10, currentY, 200, currentY);
      currentY += 5;

      // Status Distribution
      pdf.setFontSize(11);
      pdf.text('Status Distribution', 10, currentY);
      currentY += 7;

      let xPos = 10;
      Object.entries(statusCounts).forEach(([status, count]) => {
        if (xPos > 150) {
          xPos = 10;
          currentY += 15;
        }

        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(xPos, currentY, 35, 12, 2, 2, 'F');
        pdf.setDrawColor(222, 226, 230);
        pdf.roundedRect(xPos, currentY, 35, 12, 2, 2);

        pdf.setFontSize(7);
        pdf.setTextColor(51, 51, 51);
        pdf.text(
          status.charAt(0).toUpperCase() + status.slice(1),
          xPos + 17.5,
          currentY + 4,
          { align: 'center' }
        );

        pdf.setFontSize(9);
        pdf.text(count.toString(), xPos + 17.5, currentY + 9, {
          align: 'center',
        });

        xPos += 40;
      });

      currentY += 20;

      // Vehicle Types and Top Airports
      pdf.setFontSize(12);
      pdf.text('Vehicle Types', 10, currentY);
      pdf.text('Top Airports', 105, currentY);
      currentY += 7;

      // Vehicle Types
      let vehicleY = currentY;
      Object.entries(vehicleTypeCounts).forEach(([vehicle, count]) => {
        pdf.setFontSize(8);
        pdf.text(
          vehicle.charAt(0).toUpperCase() + vehicle.slice(1),
          10,
          vehicleY
        );
        pdf.text(count.toString(), 90, vehicleY, { align: 'right' });
        vehicleY += 5;
      });

      // Top Airports
      let airportY = currentY;
      Object.entries(airportCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([airport, count]) => {
          pdf.setFontSize(9);
          pdf.text(airport, 105, airportY);
          pdf.text(count.toString(), 185, airportY, { align: 'right' });
          airportY += 5;
        });

      currentY = Math.max(vehicleY, airportY) + 10;

      // Hotel Names and Trip Types
      pdf.setFontSize(10);
      pdf.text('Top Hotel Names', 10, currentY);
      pdf.text('Trip Types', 105, currentY);
      currentY += 7;

      // Hotel Names
      let hotelY = currentY;
      Object.entries(hotelCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([hotel, count]) => {
          pdf.setFontSize(9);
          pdf.text(hotel, 10, hotelY);
          pdf.text(count.toString(), 90, hotelY, { align: 'right' });
          hotelY += 5;
        });

      // Trip Types
      let tripY = currentY;
      Object.entries(tripTypeCounts).forEach(([tripType, count]) => {
        pdf.setFontSize(7);
        pdf.text(
          tripType.replace('-', ' ').charAt(0).toUpperCase() +
            tripType.replace('-', ' ').slice(1),
          105,
          tripY
        );
        pdf.text(count.toString(), 185, tripY, { align: 'right' });
        tripY += 5;
      });

      // Detailed Bookings Table (start on new page if needed)
      let tableStartY = Math.max(hotelY, tripY) + 15;

      if (tableStartY > 250) {
        pdf.addPage();
        currentPage++;
        addPageHeader(currentPage);
        tableStartY = 45;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text(`Detailed Bookings (${totalBookings})`, 10, tableStartY);
      tableStartY += 7;

      pdf.setDrawColor(221, 221, 221);
      pdf.line(10, tableStartY, 200, tableStartY);
      tableStartY += 5;

      // Table headers
      const tableHeaders = [
        '#',
        'Booking Ref',
        'Customer',
        'Hotel',
        'Airport',
        'Vehicle',
        'Trip',
        'Date',
        'Amount',
        'Status',
      ];
      const colWidths = [8, 25, 20, 35, 30, 10, 10, 20, 15, 20];
      let colX = 10;

      pdf.setFillColor(248, 249, 250);
      pdf.rect(10, tableStartY, 190, 8, 'F');
      pdf.setDrawColor(222, 226, 230);
      pdf.rect(10, tableStartY, 190, 8);

      colX = 10;
      tableHeaders.forEach((header, index) => {
        pdf.setFontSize(8);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont(undefined, 'bold');
        pdf.text(header, colX + colWidths[index] / 2, tableStartY + 5, {
          align: 'center',
        });
        colX += colWidths[index];
      });

      tableStartY += 8;

      // Table rows with pagination
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
          currentPage++;
          addPageHeader(currentPage);
          tableStartY = 45;

          // Add table headers again
          pdf.setFillColor(248, 249, 250);
          pdf.rect(10, tableStartY, 190, 8, 'F');
          pdf.setDrawColor(222, 226, 230);
          pdf.rect(10, tableStartY, 190, 8);

          colX = 10;
          tableHeaders.forEach((header, index) => {
            pdf.setFontSize(8);
            pdf.setTextColor(51, 51, 51);
            pdf.setFont(undefined, 'bold');
            pdf.text(header, colX + colWidths[index] / 2, tableStartY + 5, {
              align: 'center',
            });
            colX += colWidths[index];
          });

          tableStartY += 8;
        }

        const startIndex = page * maxRowsPerPage;
        const endIndex = Math.min(
          startIndex + maxRowsPerPage,
          bookingsData.length
        );
        const pageBookings = bookingsData.slice(startIndex, endIndex);

        pageBookings.forEach((booking, index) => {
          if (tableStartY > 270) {
            pdf.addPage();
            currentPage++;
            addPageHeader(currentPage);
            tableStartY = 45;

            // Add table headers again
            pdf.setFillColor(248, 249, 250);
            pdf.rect(10, tableStartY, 190, 8, 'F');
            pdf.setDrawColor(222, 226, 230);
            pdf.rect(10, tableStartY, 190, 8);

            colX = 10;
            tableHeaders.forEach((header, idx) => {
              pdf.setFontSize(8);
              pdf.setTextColor(51, 51, 51);
              pdf.setFont(undefined, 'bold');
              pdf.text(header, colX + colWidths[idx] / 2, tableStartY + 5, {
                align: 'center',
              });
              colX += colWidths[idx];
            });

            tableStartY += 8;
          }

          const rowY = tableStartY;

          // Row background (alternating)
          if ((startIndex + index) % 2 === 0) {
            pdf.setFillColor(255, 255, 255);
          } else {
            pdf.setFillColor(250, 250, 250);
          }
          pdf.rect(10, rowY, 190, 8, 'F');
          pdf.setDrawColor(222, 226, 230);
          pdf.rect(10, rowY, 190, 8);

          // Row data
          colX = 10;

          // Index
          pdf.setFontSize(7);
          pdf.setTextColor(51, 51, 51);
          pdf.setFont(undefined, 'normal');
          pdf.text((startIndex + index + 1).toString(), colX + 4, rowY + 5);
          colX += colWidths[0];

          // Booking Reference
          pdf.text(booking.bookingReference || 'N/A', colX + 2, rowY + 5);
          colX += colWidths[1];

          // Customer (truncated if too long)
          const customerText = booking.guestName || 'N/A';
          if (customerText.length > 15) {
            pdf.text(customerText.substring(0, 15) + '...', colX + 2, rowY + 5);
          } else {
            pdf.text(customerText, colX + 2, rowY + 5);
          }
          colX += colWidths[2];

          // Hotel Name
          const hotelName = booking.transfer?.airportCode || 'N/A';
          if (hotelName.length > 10) {
            pdf.text(hotelName.substring(0, 10) + '...', colX + 2, rowY + 5);
          } else {
            pdf.text(hotelName, colX + 2, rowY + 5);
          }
          colX += colWidths[3];

          // Airport Name
          const airportName = booking.transfer?.airportName || 'N/A';
          if (airportName.length > 10) {
            pdf.text(airportName.substring(0, 10) + '...', colX + 2, rowY + 5);
          } else {
            pdf.text(airportName, colX + 2, rowY + 5);
          }
          colX += colWidths[4];

          // Vehicle Type
          const vehicleType = booking.transfer?.vehicleType || '';
          pdf.text(
            vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1),
            colX + 2,
            rowY + 5
          );
          colX += colWidths[5];

          // Trip Type
          const tripType = booking.tripType || '';
          pdf.text(
            tripType.replace('-', ' ').charAt(0).toUpperCase(),
            colX + 2,
            rowY + 5
          );
          colX += colWidths[6];

          // Date
          pdf.text(
            formatDateForDisplay(booking.arrivalDate),
            colX + 2,
            rowY + 5
          );
          colX += colWidths[7];

          // Amount
          pdf.text(`$${booking.totalPrice || '0.00'}`, colX + 2, rowY + 5);
          colX += colWidths[8];

          // Status
          const status = booking.status || '';
          const statusColor = getStatusColor(status);
          pdf.setFillColor(
            statusColor.fill[0],
            statusColor.fill[1],
            statusColor.fill[2]
          );
          pdf.roundedRect(colX + 2, rowY + 2, 16, 4, 1, 1, 'F');
          pdf.setTextColor(
            statusColor.text[0],
            statusColor.text[1],
            statusColor.text[2]
          );
          pdf.setFontSize(6);
          pdf.text(
            status.charAt(0).toUpperCase() + status.slice(1),
            colX + 10,
            rowY + 4.5,
            { align: 'center' }
          );

          tableStartY += 8;
        });
      }

      // Footer on last page
      pdf.setPage(totalPages);
      pdf.setFontSize(8);
      pdf.setTextColor(102, 102, 102);
      pdf.text('Holiday Vibes Airport Transfers', 10, 285);
      pdf.text(`Report ID: HV-${Date.now().toString().slice(-8)}`, 10, 288);
      pdf.text(
        `© ${new Date().getFullYear()} Holiday Vibes. All rights reserved.`,
        200,
        285,
        { align: 'right' }
      );
      pdf.text('Confidential Business Report', 200, 288, { align: 'right' });

      const fileName = `airport-transfers-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
      pdf.save(fileName);

      setIsDownloadModalOpen(false);
      setDateRange({ startDate: '', endDate: '' });
      setDownloadLoading(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report. Please try again.');
      setDownloadLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { fill: [254, 243, 199], text: [146, 64, 14] },
      confirmed: { fill: [209, 250, 229], text: [6, 95, 70] },
      completed: { fill: [219, 234, 254], text: [30, 64, 175] },
      cancelled: { fill: [254, 226, 226], text: [153, 27, 27] },
      rejected: { fill: [243, 244, 246], text: [55, 65, 81] },
    };
    return colors[status] || { fill: [243, 244, 246], text: [55, 65, 81] };
  };

  const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForCSV = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDate = (dateString) => {
    return formatDateForDisplay(dateString);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border border-green-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200',
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

  const previewCount = () => {
    if (!dateRange.startDate || !dateRange.endDate)
      return 'Select dates to see count';
    const filtered = getFilteredBookingsForReport();
    return `${filtered.length} bookings found`;
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setMonthFilter('');
    setYearFilter('');
  };

  const handleDownloadReport = () => {
    if (downloadType === 'pdf') {
      generatePDFReport();
    } else {
      generateCSVReport();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Airport Transfer Bookings
              </h1>
              <p className="text-gray-600">
                Manage and monitor airport transfer bookings
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition duration-200"
              >
                <i className="fas fa-download mr-2"></i>
                Download Report
              </button>
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
                  <button
                    onClick={() => setError('')}
                    className="text-red-600 hover:text-red-800 text-sm mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <i className="fas fa-calendar-alt text-blue-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalBookings?.[0]?.count || 0}
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
                      {stats.byStatus?.find((s) => s._id === 'confirmed')
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
                      {stats.byStatus?.find((s) => s._id === 'pending')
                        ?.count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <i className="fas fa-dollar-sign text-purple-600"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${stats.totalRevenue?.[0]?.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 w-40"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Month
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-40"
                      >
                        <option value="">All Months</option>
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-32"
                      >
                        <option value="">All Years</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>

                      {filtersApplied && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-6 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          title="Clear all filters"
                        >
                          <i className="fas fa-filter-circle-xmark"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={fetchBookings}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <i className="fas fa-sync-alt mr-2"></i>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {bookings.length === allBookings.length
                      ? `Showing all ${bookings.length} bookings`
                      : `Showing ${bookings.length} of ${allBookings.length} bookings`}
                    {monthFilter && yearFilter
                      ? ` for ${
                          months.find((m) => m.value === monthFilter)?.label
                        } ${yearFilter}`
                      : monthFilter
                      ? ` for ${
                          months.find((m) => m.value === monthFilter)?.label
                        } ${currentYear}`
                      : yearFilter
                      ? ` for year ${yearFilter}`
                      : ''}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">View:</span>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md ${
                      viewMode === 'table'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className="fas fa-table mr-1"></i> Table
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1 rounded-md ${
                      viewMode === 'calendar'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <i className="fas fa-calendar mr-1"></i> Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {viewMode === 'calendar' ? (
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="text-center py-12">
                <i className="fas fa-calendar text-gray-300 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Calendar View
                </h3>
                <p className="text-gray-500 mb-4">
                  Calendar view coming soon. Currently showing table view.
                </p>
                <button
                  onClick={() => setViewMode('table')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Back to Table View
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-calendar-times text-gray-300 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No bookings found
                  </h3>
                  <p className="text-gray-500">
                    {!filtersApplied
                      ? 'No airport transfer bookings yet.'
                      : 'No bookings match the selected filters.'}
                  </p>
                  {filtersApplied && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking Ref
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hotel Name
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Airport
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transfer
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trip Details
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.transfer?.airportCode || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.transfer?.airportName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
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
                            ${booking.totalPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Update Status"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isDownloadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Download Excursion Bookings Report (before payment)
                </h3>
                <button
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Generate a report of airport transfer bookings for a specific
                  period.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Format
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="downloadType"
                        value="pdf"
                        checked={downloadType === 'pdf'}
                        onChange={(e) => setDownloadType(e.target.value)}
                      />
                      <span className="ml-2">PDF</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="downloadType"
                        value="csv"
                        checked={downloadType === 'csv'}
                        onChange={(e) => setDownloadType(e.target.value)}
                      />
                      <span className="ml-2">CSV</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange({
                          ...dateRange,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange({ ...dateRange, endDate: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min={dateRange.startDate}
                    />
                  </div>

                  {dateRange.startDate && dateRange.endDate && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <i className="fas fa-info-circle mr-2"></i>
                        {previewCount()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Note: Future dates are allowed for planning reports
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Report will include: Booking Reference, Customer, Hotel
                        Name, Airport, Vehicle Type, Trip Type, Date, Amount,
                        Status
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={downloadLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={
                    downloadLoading ||
                    !dateRange.startDate ||
                    !dateRange.endDate
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
                >
                  {downloadLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i
                        className={`fas ${
                          downloadType === 'pdf' ? 'fa-file-pdf' : 'fa-file-csv'
                        } mr-2`}
                      ></i>
                      Generate {downloadType.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <option value="completed">Completed</option>
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
