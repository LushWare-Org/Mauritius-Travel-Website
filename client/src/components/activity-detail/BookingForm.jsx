import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ activity }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  // Remove guests state - always use 1
  const [selectedDuration, setSelectedDuration] = useState('halfDay');
  const [totalPrice, setTotalPrice] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Airport Transfer State
  const [includeAirportTransfer, setIncludeAirportTransfer] = useState(false);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState('');
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [airportTransferLoading, setAirportTransferLoading] = useState(false);
  const [airportTransferPrice, setAirportTransferPrice] = useState(0);
  const [tripType, setTripType] = useState('one-way');

  // Check if we should show duration selection
  const showDurationSelection = () => {
    return (
      activity.pricingType === 'half-full-day' ||
      activity.halfDayPrice ||
      activity.fullDayPrice
    );
  };

  // Calculate price based on selection
  const getCurrentPrice = () => {
    if (showDurationSelection()) {
      return selectedDuration === 'halfDay'
        ? activity.halfDayPrice || activity.price
        : activity.fullDayPrice || activity.price;
    }
    return activity.price;
  };

  // Fetch airport transfers from database when checkbox is checked
  useEffect(() => {
    const fetchAirportTransfers = async () => {
      if (!includeAirportTransfer) {
        return;
      }

      try {
        setAirportTransferLoading(true);
        console.log('🔄 Fetching airport transfers from database...');

        // Use the VITE_API_URL from your environment
        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const url = `${baseUrl}/airport-transfers/active`;
        console.log('📡 Fetching from:', url);

        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch airport transfers: ${response.status}`
          );
        }

        const data = await response.json();
        console.log('📊 Airport transfers data:', data);

        if (data.success && data.data.length > 0) {
          setAirportTransfers(data.data);
          setSelectedAirportTransfer(data.data[0]._id);
          const initialPrice =
            tripType === 'one-way'
              ? data.data[0].oneWayPrice
              : data.data[0].roundTripPrice;
          setAirportTransferPrice(initialPrice);
          console.log(`✅ Loaded ${data.data.length} airport transfers`);
        } else {
          console.log('⚠️ No airport transfers available in database');
          setAirportTransfers([]);
        }
      } catch (error) {
        console.error('❌ Error fetching airport transfers:', error);
        setAirportTransfers([]);
      } finally {
        setAirportTransferLoading(false);
      }
    };

    fetchAirportTransfers();
  }, [includeAirportTransfer, tripType]); // Re-fetch when checkbox or trip type changes

  // Handle airport transfer selection change
  const handleAirportTransferChange = (e) => {
    const transferId = e.target.value;
    setSelectedAirportTransfer(transferId);

    // Find the selected transfer and calculate price
    const selectedTransfer = airportTransfers.find((t) => t._id === transferId);
    if (selectedTransfer) {
      const price =
        tripType === 'one-way'
          ? selectedTransfer.oneWayPrice
          : selectedTransfer.roundTripPrice;
      setAirportTransferPrice(price);
    }
  };

  // Handle trip type change
  const handleTripTypeChange = (newTripType) => {
    setTripType(newTripType);

    // Recalculate price if a transfer is selected
    if (selectedAirportTransfer && airportTransfers.length > 0) {
      const selectedTransfer = airportTransfers.find(
        (t) => t._id === selectedAirportTransfer
      );
      if (selectedTransfer) {
        const price =
          newTripType === 'one-way'
            ? selectedTransfer.oneWayPrice
            : selectedTransfer.roundTripPrice;
        setAirportTransferPrice(price);
      }
    }
  };

  // Update total price calculation - REMOVED multiplication by guests
  useEffect(() => {
    const pricePerPerson = getCurrentPrice();
    let total = pricePerPerson; // Removed * guests - just use per person price
    
    // Add airport transfer cost if selected
    if (includeAirportTransfer && airportTransferPrice > 0) {
      total += airportTransferPrice;
    }

    setTotalPrice(total);
  }, [
    activity,
    selectedDuration,
    includeAirportTransfer,
    airportTransferPrice,
    tripType,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    // Navigate to booking page with selected information
    navigate(`/booking/${activity._id || activity.id}`, {
      state: {
        selectedDate,
        guests: 1, // Always send 1 guest
        selectedDuration,
        selectedPrice: getCurrentPrice(),
        includeAirportTransfer,
        ...(includeAirportTransfer && {
          airportTransferId: selectedAirportTransfer,
          airportTransferType: tripType,
          airportTransferPrice: airportTransferPrice,
        }),
      },
    });
  };

  // Calendar functions
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // Days in month
    const daysInMonth = lastDay.getDate();
    // Starting day (0 = Sunday, 1 = Monday, etc.)
    const startDay = firstDay.getDay();

    const today = new Date();
    const days = [];

    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isPast: date < today,
        isToday: date.toDateString() === today.toDateString(),
        formatted: date.toISOString().split('T')[0],
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast =
        date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({
        date,
        isCurrentMonth: true,
        isPast: isPast,
        isToday: date.toDateString() === today.toDateString(),
        formatted: date.toISOString().split('T')[0],
      });
    }

    // Next month's days (to fill the grid)
    const totalCells = 42; // 6 weeks * 7 days
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        formatted: date.toISOString().split('T')[0],
      });
    }

    return days;
  };

  const handleDateSelect = (date) => {
    if (!date.isPast) {
      setSelectedDate(date.formatted);
      setShowCalendar(false);
    }
  };

  const prevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Select a date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get selected airport transfer details
  const getSelectedAirportTransfer = () => {
    return airportTransfers.find((t) => t._id === selectedAirportTransfer);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-3xl font-bold">${getCurrentPrice()}</div>
            <div className="text-sm opacity-90">per person</div>
          </div>
          {showDurationSelection() && (
            <div className="text-sm bg-white/20 backdrop-blur-sm rounded-full px-4 py-1">
              {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}
            </div>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">
          Duration: {activity?.duration || 4} hours
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Duration Selection */}
        {showDurationSelection() && (
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              Select Duration
            </label>
            <div className="flex space-x-3">
              <button
                type="button"
                className={`flex-1 py-4 px-4 rounded-xl transition-all duration-300 ${
                  selectedDuration === 'halfDay'
                    ? 'bg-blue-600 text-white shadow-lg transform -translate-y-1'
                    : 'bg-white text-blue-700 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md'
                }`}
                onClick={() => setSelectedDuration('halfDay')}
              >
                <div className="text-lg font-semibold">Half Day</div>
                <div className="text-sm opacity-75 mt-1">
                  ${activity.halfDayPrice || activity.price}
                </div>
              </button>
              <button
                type="button"
                className={`flex-1 py-4 px-4 rounded-xl transition-all duration-300 ${
                  selectedDuration === 'fullDay'
                    ? 'bg-blue-600 text-white shadow-lg transform -translate-y-1'
                    : 'bg-white text-blue-700 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md'
                }`}
                onClick={() => setSelectedDuration('fullDay')}
              >
                <div className="text-lg font-semibold">Full Day</div>
                <div className="text-sm opacity-75 mt-1">
                  ${activity.fullDayPrice || activity.price}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Calendar Date Picker */}
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">
            Select Date
          </label>

          {/* Selected Date Display */}
          <div
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span
                className={`${
                  selectedDate ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {formatDateDisplay(selectedDate)}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                showCalendar ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>

          {/* Calendar Dropdown */}
          {showCalendar && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                </button>
                <div className="text-lg font-semibold text-gray-800">
                  {currentMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={day.isPast}
                    className={`
                      h-10 rounded-lg transition-all duration-200 text-sm font-medium
                      ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${
                        day.isPast
                          ? 'cursor-not-allowed opacity-50'
                          : 'hover:bg-blue-50 hover:scale-105'
                      }
                      ${
                        selectedDate === day.formatted
                          ? 'bg-blue-600 text-white hover:bg-blue-700 scale-105'
                          : ''
                      }
                      ${
                        day.isToday && !selectedDate
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : ''
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>

              {/* Quick Date Selection */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Quick Select
                </div>
                <div className="flex space-x-2">
                  {[1, 3, 7].map((days) => {
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    const formatted = date.toISOString().split('T')[0];
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() =>
                          handleDateSelect({
                            date,
                            isPast: false,
                            formatted,
                          })
                        }
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        In {days} day{days > 1 ? 's' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Airport Transfer Section - Only loads when checked */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Add Airport Transfer
              </h3>
              <p className="text-sm text-gray-600">
                Convenient airport pickup/drop-off service
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAirportTransfer}
                onChange={(e) => setIncludeAirportTransfer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Only show content when checkbox is checked */}
          {includeAirportTransfer && (
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fadeIn">
              {/* Show loading state while fetching */}
              {airportTransferLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <span className="text-gray-600">
                    Loading available transfers...
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    Fetching options from our database
                  </p>
                </div>
              ) : airportTransfers.length === 0 ? (
                <div className="text-center py-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          ></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-yellow-700">
                          No airport transfers available at the moment.
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">
                          Please contact our support team for airport transfer
                          arrangements.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Trip Type Selection */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Trip Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleTripTypeChange('one-way')}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          tripType === 'one-way'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        One Way
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTripTypeChange('round-trip')}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          tripType === 'round-trip'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Round Trip
                      </button>
                    </div>
                  </div>

                  {/* Airport Selection */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Select Airport Service
                    </label>
                    <select
                      value={selectedAirportTransfer}
                      onChange={handleAirportTransferChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {airportTransfers.map((transfer) => (
                        <option key={transfer._id} value={transfer._id}>
                          {transfer.airportName} ({transfer.airportCode}) -{' '}
                          {transfer.vehicleType}- $
                          {tripType === 'one-way'
                            ? transfer.oneWayPrice
                            : transfer.roundTripPrice}
                          ({tripType === 'one-way' ? 'One Way' : 'Round Trip'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transfer Details */}
                  {getSelectedAirportTransfer() && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              ></path>
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {getSelectedAirportTransfer().airportName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getSelectedAirportTransfer().airportCode} •{' '}
                              {getSelectedAirportTransfer().vehicleType}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ${airportTransferPrice}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tripType === 'one-way' ? 'One Way' : 'Round Trip'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mt-4">
                        <div className="text-center">
                          <div className="font-medium">Capacity</div>
                          <div>
                            {getSelectedAirportTransfer().capacity} passengers
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Duration</div>
                          <div>
                            {getSelectedAirportTransfer().estimatedTime}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Type</div>
                          <div className="capitalize">
                            {getSelectedAirportTransfer().vehicleType}
                          </div>
                        </div>
                      </div>

                      {/* Price Comparison */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <div>
                            <div className="text-gray-700">One Way Price:</div>
                            <div className="text-gray-500">Per vehicle</div>
                          </div>
                          <div className="font-medium text-gray-900">
                            ${getSelectedAirportTransfer().oneWayPrice}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <div>
                            <div className="text-blue-700">
                              Round Trip Price:
                            </div>
                            <div className="text-blue-500">
                              Save with return
                            </div>
                          </div>
                          <div className="font-bold text-blue-600">
                            ${getSelectedAirportTransfer().roundTripPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Included Services */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="text-sm text-green-800 space-y-2">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>Meet & greet service at airport</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>Luggage assistance included</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>Professional English-speaking driver</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>Airport pick-up / hotel drop-off</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Price Calculation */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-5 border border-blue-100">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {showDurationSelection() ? (
                  <>
                    {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}{' '}
                    rate
                  </>
                ) : (
                  <>${getCurrentPrice()} per person</>
                )}
              </span>
              <span className="font-medium">${getCurrentPrice()}</span>
            </div>

            {/* Airport Transfer Line Item */}
            {includeAirportTransfer && airportTransferPrice > 0 && (
              <div className="flex justify-between items-center border-t border-blue-100 pt-3">
                <div>
                  <span className="text-gray-700">Airport Transfer</span>
                  <div className="text-sm text-gray-500">
                    {tripType === 'one-way' ? 'One Way' : 'Round Trip'} •{' '}
                    {getSelectedAirportTransfer()?.vehicleType || 'Vehicle'}
                  </div>
                </div>
                <span className="font-medium text-blue-600">
                  ${airportTransferPrice}
                </span>
              </div>
            )}

            <div className="border-t border-blue-200 pt-3">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-blue-800">Total Amount</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-800">
                    ${totalPrice}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {includeAirportTransfer
                      ? 'Includes activity + airport transfer'
                      : 'Activity only'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedDate}
          className={`
            w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300
            flex items-center justify-center
            ${
              selectedDate
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {selectedDate ? (
            <>
              <span>Continue to Book</span>
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                ></path>
              </svg>
            </>
          ) : (
            'Select a date to continue'
          )}
        </button>

        {/* Booking Info */}
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm">
            <svg
              className="w-4 h-4 inline mr-1 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            Free cancellation up to 24 hours before
          </p>
          <p className="text-gray-500 text-sm">
            <svg
              className="w-4 h-4 inline mr-1 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
            Secure payment processing
          </p>
          {includeAirportTransfer && (
            <p className="text-gray-500 text-sm">
              <svg
                className="w-4 h-4 inline mr-1 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              Airport transfer confirmation within 2 hours
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default BookingForm;