import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ activity }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
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

        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const url = `${baseUrl}/airport-transfers/active`;

        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch airport transfers: ${response.status}`
          );
        }

        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setAirportTransfers(data.data);
          setSelectedAirportTransfer(data.data[0]._id);
          const initialPrice =
            tripType === 'one-way'
              ? data.data[0].oneWayPrice
              : data.data[0].roundTripPrice;
          setAirportTransferPrice(initialPrice);
        } else {
          setAirportTransfers([]);
        }
      } catch (error) {
        console.error('Error fetching airport transfers:', error);
        setAirportTransfers([]);
      } finally {
        setAirportTransferLoading(false);
      }
    };

    fetchAirportTransfers();
  }, [includeAirportTransfer, tripType]);

  // Handle airport transfer selection change
  const handleAirportTransferChange = (e) => {
    const transferId = e.target.value;
    setSelectedAirportTransfer(transferId);

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

  // Update total price calculation
  useEffect(() => {
    const pricePerPerson = getCurrentPrice();
    let total = pricePerPerson;

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

    navigate(`/booking/${activity._id || activity.id}`, {
      state: {
        selectedDate,
        guests: 1,
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
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const today = new Date();
    const days = [];

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

    const totalCells = 42;
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Function to format airport transfer display with airport code
  const formatAirportTransferOption = (transfer) => {
    const airportCode = transfer.airportCode || transfer.airportIATA || '';
    const airportName = transfer.airportName || 'Airport Transfer';
    const price =
      tripType === 'one-way' ? transfer.oneWayPrice : transfer.roundTripPrice;

    if (airportCode) {
      return `${airportName} (${airportCode}) - $${price}`;
    }
    return `${airportName} - $${price}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-24">
      {/* Price Header */}
      <div className="bg-blue-800 text-white p-5 rounded-t-lg mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">${getCurrentPrice()}</div>
            <div className="text-sm opacity-90">per person</div>
          </div>
          {showDurationSelection() && (
            <div className="bg-white/10 px-3 py-1 rounded-full text-sm">
              {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Duration Selection */}
        {showDurationSelection() && (
          <div>
            <label className="block text-gray-700 font-medium mb-3">
              Select Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-4 rounded-lg border transition-colors ${
                  selectedDuration === 'halfDay'
                    ? 'bg-blue-800 text-white border-blue-800'
                    : 'border-gray-300 text-gray-700 hover:border-blue-800'
                }`}
                onClick={() => setSelectedDuration('halfDay')}
              >
                <div className="font-medium">Half Day</div>
                <div className="text-sm mt-1">
                  ${activity.halfDayPrice || activity.price}
                </div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border transition-colors ${
                  selectedDuration === 'fullDay'
                    ? 'bg-blue-800 text-white border-blue-800'
                    : 'border-gray-300 text-gray-700 hover:border-blue-800'
                }`}
                onClick={() => setSelectedDuration('fullDay')}
              >
                <div className="font-medium">Full Day</div>
                <div className="text-sm mt-1">
                  ${activity.fullDayPrice || activity.price}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div>
          <label className="block text-gray-700 font-medium mb-3">
            Select Date
          </label>

          <div
            className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-800 transition-colors"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-gray-500 mr-3"
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
              <span
                className={selectedDate ? 'text-gray-900' : 'text-gray-500'}
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
              />
            </svg>
          </div>

          {showCalendar && (
            <div className="absolute z-10 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-gray-100 rounded"
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
                    />
                  </svg>
                </button>
                <div className="font-medium text-gray-800">
                  {currentMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-gray-100 rounded"
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
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs text-gray-500 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={day.isPast}
                    className={`
                      h-8 rounded text-sm
                      ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${
                        day.isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'hover:bg-blue-50'
                      }
                      ${
                        selectedDate === day.formatted
                          ? 'bg-blue-800 text-white hover:bg-blue-900'
                          : ''
                      }
                      ${
                        day.isToday && !selectedDate
                          ? 'border border-blue-800 text-blue-800'
                          : ''
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Airport Transfer */}
        <div className="border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-800">Airport Transfer</h3>
              <p className="text-sm text-gray-600">Optional add-on service</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAirportTransfer}
                onChange={(e) => setIncludeAirportTransfer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-800"></div>
            </label>
          </div>

          {includeAirportTransfer && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              {airportTransferLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto mb-2"></div>
                  <span className="text-gray-600">Loading transfers...</span>
                </div>
              ) : airportTransfers.length === 0 ? (
                <div className="text-center py-4 text-gray-600">
                  No airport transfers available
                </div>
              ) : (
                <>
                  {/* Trip Type */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Trip Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTripTypeChange('one-way')}
                        className={`py-2 rounded border ${
                          tripType === 'one-way'
                            ? 'bg-blue-800 text-white border-blue-800'
                            : 'border-gray-300 text-gray-700 hover:border-blue-800'
                        }`}
                      >
                        One Way
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTripTypeChange('round-trip')}
                        className={`py-2 rounded border ${
                          tripType === 'round-trip'
                            ? 'bg-blue-800 text-white border-blue-800'
                            : 'border-gray-300 text-gray-700 hover:border-blue-800'
                        }`}
                      >
                        Round Trip
                      </button>
                    </div>
                  </div>

                  {/* Airport Selection */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Select Airport Transfer
                    </label>
                    <div className="space-y-2">
                      {airportTransfers.map((transfer) => (
                        <label
                          key={transfer._id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-800 transition-colors ${
                            selectedAirportTransfer === transfer._id
                              ? 'border-blue-800 bg-blue-50'
                              : 'border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="airportTransfer"
                              value={transfer._id}
                              checked={selectedAirportTransfer === transfer._id}
                              onChange={handleAirportTransferChange}
                              className="mr-3"
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Airport to Hotel 
                              </label>
                              <div className="font-medium text-gray-800">
                                {transfer.airportName}
                                {transfer.airportCode && (
                                  <span className="ml-2 text-sm font-normal text-gray-600">
                                    ({transfer.airportCode})
                                  </span>
                                )}
                              </div>
                              {transfer.location && (
                                <div className="text-sm text-gray-600">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {transfer.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-800">
                              $
                              {tripType === 'one-way'
                                ? transfer.oneWayPrice
                                : transfer.roundTripPrice}
                            </div>
                            <div className="text-xs text-gray-500">
                              {tripType === 'one-way'
                                ? 'One Way'
                                : 'Round Trip'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Selected Transfer Details */}
                  {selectedAirportTransfer && airportTransfers.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-800">
                            Selected:{' '}
                            {
                              airportTransfers.find(
                                (t) => t._id === selectedAirportTransfer
                              )?.airportName
                            }
                          </div>
                          {airportTransfers.find(
                            (t) => t._id === selectedAirportTransfer
                          )?.airportCode && (
                            <div className="text-sm text-gray-600">
                              Hotel name:{' '}
                              {
                                airportTransfers.find(
                                  (t) => t._id === selectedAirportTransfer
                                )?.airportCode
                              }
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-800">
                            ${airportTransferPrice}
                          </div>
                          <div className="text-sm text-gray-600">
                            {tripType === 'one-way' ? 'One Way' : 'Round Trip'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Activity</span>
              <span className="font-medium">${getCurrentPrice()}</span>
            </div>

            {includeAirportTransfer && airportTransferPrice > 0 && (
              <>
                <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                  <div>
                    <span className="text-gray-700">Airport Transfer</span>
                    {selectedAirportTransfer && airportTransfers.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {
                          airportTransfers.find(
                            (t) => t._id === selectedAirportTransfer
                          )?.airportName
                        }
                        {airportTransfers.find(
                          (t) => t._id === selectedAirportTransfer
                        )?.airportCode && (
                          <span>
                            {' '}
                            (
                            {
                              airportTransfers.find(
                                (t) => t._id === selectedAirportTransfer
                              )?.airportCode
                            }
                            )
                          </span>
                        )}
                        {' - '}
                        {tripType === 'one-way' ? 'One Way' : 'Round Trip'}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-blue-800">
                    ${airportTransferPrice}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center border-t border-gray-300 pt-3">
              <span className="font-bold text-gray-900">Total</span>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-800">
                  ${totalPrice}
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
            w-full py-3 rounded-lg font-medium transition-colors
            ${
              selectedDate
                ? 'bg-blue-800 text-white hover:bg-blue-900'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {selectedDate ? 'Continue to Booking' : 'Select a Date First'}
        </button>

        {/* Info */}
        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>✓ Free cancellation 24h before</p>
          <p>✓ Secure payment</p>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
