import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ activity }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('halfDay');
  const [totalPrice, setTotalPrice] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const [includeAirportTransfer, setIncludeAirportTransfer] = useState(false);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState('');
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [airportTransferPrice, setAirportTransferPrice] = useState(0);
  const [tripType, setTripType] = useState('one-way');

  const showDurationSelection = () => {
    return activity.halfDayPrice || activity.fullDayPrice;
  };

  const getCurrentPrice = () => {
    if (showDurationSelection()) {
      return selectedDuration === 'halfDay'
        ? activity.halfDayPrice || activity.price
        : activity.fullDayPrice || activity.price;
    }
    return activity.price;
  };

  // Get selected airport transfer details
  const getSelectedAirportTransfer = () => {
    if (!selectedAirportTransfer || airportTransfers.length === 0) return null;
    return airportTransfers.find(t => t._id === selectedAirportTransfer);
  };

  const selectedAirport = getSelectedAirportTransfer();

  useEffect(() => {
    const fetchAirportTransfers = async () => {
      if (!includeAirportTransfer) return;

      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const response = await fetch(`${baseUrl}/airport-transfers/active`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setAirportTransfers(data.data);
            setSelectedAirportTransfer(data.data[0]._id);
            const price = tripType === 'one-way' 
              ? data.data[0].oneWayPrice 
              : data.data[0].roundTripPrice;
            setAirportTransferPrice(price);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchAirportTransfers();
  }, [includeAirportTransfer, tripType]);

  const handleAirportTransferChange = (e) => {
    const transferId = e.target.value;
    setSelectedAirportTransfer(transferId);
    
    const selectedTransfer = airportTransfers.find(t => t._id === transferId);
    if (selectedTransfer) {
      const price = tripType === 'one-way' 
        ? selectedTransfer.oneWayPrice 
        : selectedTransfer.roundTripPrice;
      setAirportTransferPrice(price);
    }
  };

  const handleTripTypeChange = (newTripType) => {
    setTripType(newTripType);
    
    if (selectedAirportTransfer) {
      const selectedTransfer = airportTransfers.find(t => t._id === selectedAirportTransfer);
      if (selectedTransfer) {
        const price = newTripType === 'one-way' 
          ? selectedTransfer.oneWayPrice 
          : selectedTransfer.roundTripPrice;
        setAirportTransferPrice(price);
      }
    }
  };

  useEffect(() => {
    const pricePerPerson = getCurrentPrice();
    let total = pricePerPerson;
    
    if (includeAirportTransfer && airportTransferPrice > 0) {
      total += airportTransferPrice;
    }
    
    setTotalPrice(total);
  }, [activity, selectedDuration, includeAirportTransfer, airportTransferPrice, tripType]);

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

  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ 
        date, 
        isCurrentMonth: false, 
        isPast: date < today, 
        formatted: date.toISOString().split('T')[0] 
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({ 
        date, 
        isCurrentMonth: true, 
        isPast, 
        formatted: date.toISOString().split('T')[0] 
      });
    }

    return days.slice(0, 35); // Show only 5 weeks
  };

  const handleDateSelect = (date) => {
    if (!date.isPast) {
      setSelectedDate(date.formatted);
      setShowCalendar(false);
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Function to format airport transfer option display
  const formatAirportTransferOption = (transfer) => {
    const airportCode = transfer.airportCode || '';
    const airportName = transfer.airportName || 'Airport Transfer';
    const price = tripType === 'one-way' ? transfer.oneWayPrice : transfer.roundTripPrice;
    
    return `${airportCode ? `${airportCode} - ` : ''}${airportName} - $${price}`;
  };

  // Function to get airport code display text
  const getAirportCodeDisplay = () => {
    if (!selectedAirport) return '';
    return selectedAirport.airportCode || '';
  };

  // Function to get airport name display text
  const getAirportNameDisplay = () => {
    if (!selectedAirport) return '';
    return selectedAirport.airportName || '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 sticky top-24">
      {/* Price Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">${getCurrentPrice()}</div>
            <div className="text-xs opacity-90 mt-1">per person</div>
          </div>
          {showDurationSelection() && (
            <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-medium">
              {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Duration Selection */}
        {showDurationSelection() && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Duration</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedDuration('halfDay')}
                className={`p-3 rounded-lg border transition-all ${
                  selectedDuration === 'halfDay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-left">
                  <div className={`font-semibold text-sm ${
                    selectedDuration === 'halfDay' ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    Half Day
                  </div>
                  <div className={`text-lg font-bold ${
                    selectedDuration === 'halfDay' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    ${activity.halfDayPrice || activity.price}
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedDuration('fullDay')}
                className={`p-3 rounded-lg border transition-all ${
                  selectedDuration === 'fullDay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-left">
                  <div className={`font-semibold text-sm ${
                    selectedDuration === 'fullDay' ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    Full Day
                  </div>
                  <div className={`text-lg font-bold ${
                    selectedDuration === 'fullDay' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    ${activity.fullDayPrice || activity.price}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Date</label>
          <div className="relative">
            <div
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-400"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedDate ? formatDateDisplay(selectedDate) : 'Choose date'}
                </span>
              </div>
              <svg className={`w-4 h-4 text-gray-400 ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showCalendar && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                    <div key={day} className="text-center text-xs text-gray-500 py-1">
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
                        h-8 text-xs rounded transition-colors
                        ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${day.isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                        ${selectedDate === day.formatted 
                          ? 'bg-blue-600 text-white' 
                          : ''}
                      `}
                    >
                      {day.date.getDate()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Airport Transfer Toggle */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-800 text-sm">Add Airport Transfer</div>
              <div className="text-xs text-gray-500 mt-1">Optional transportation</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAirportTransfer}
                onChange={(e) => setIncludeAirportTransfer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-300 peer-checked:bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
            </label>
          </div>

          {includeAirportTransfer && airportTransfers.length > 0 && (
            <div className="mt-4 space-y-3">
              {/* Trip Type */}
              <div>
                <div className="text-sm text-gray-700 mb-2">Trip Type</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTripTypeChange('one-way')}
                    className={`p-2 rounded-lg border text-sm ${
                      tripType === 'one-way'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    One Way
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTripTypeChange('round-trip')}
                    className={`p-2 rounded-lg border text-sm ${
                      tripType === 'round-trip'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    Round Trip
                  </button>
                </div>
              </div>

              {/* Airport Selection */}
              <div>
                <div className="text-sm text-gray-700 mb-2">Select Transfer</div>
                <select
                  value={selectedAirportTransfer}
                  onChange={handleAirportTransferChange}
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {airportTransfers.map((transfer) => (
                    <option key={transfer._id} value={transfer._id}>
                      {formatAirportTransferOption(transfer)}
                    </option>
                  ))}
                </select>
                
                {/* Selected airport details - Showing both code and name */}
                {selectedAirport && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <div className="text-xs text-gray-700">
                        <span className="font-medium mr-2">Selected airport code:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                          {getAirportCodeDisplay()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="text-xs text-gray-700">
                        <span className="font-medium mr-2">Selected hotel name:</span>
                        <span className="text-gray-900 font-medium">
                          {getAirportNameDisplay()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-gray-800 text-sm">{activity.title}</div>
                {showDurationSelection() && (
                  <div className="text-xs text-gray-500">
                    {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}
                  </div>
                )}
              </div>
              <div className="font-semibold text-gray-900">${getCurrentPrice()}</div>
            </div>

            {includeAirportTransfer && airportTransferPrice > 0 && selectedAirport && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-sm text-gray-800 font-medium">Airport Transfer</div>
                    {/* Display both airport code and name */}
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold text-blue-700">{getAirportCodeDisplay()}</span>
                      {getAirportCodeDisplay() && getAirportNameDisplay() && (
                        <span className="mx-1">•</span>
                      )}
                      <span>{getAirportNameDisplay()}</span>
                    </div>
                  </div>
                  <div className="font-semibold text-blue-600">+${airportTransferPrice}</div>
                </div>
                
                {/* Additional transfer details */}
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="mr-2">{tripType === 'one-way' ? 'One Way' : 'Round Trip'}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedAirport.vehicleType || 'Standard Vehicle'}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-300">
              <div className="font-bold text-gray-900">Total</div>
              <div className="text-2xl font-bold text-blue-600">${totalPrice}</div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedDate}
          className={`
            w-full py-3 rounded-lg font-semibold transition-all
            ${selectedDate
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {selectedDate ? 'Book Now' : 'Select Date'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;