import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ activity }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('halfDay');
  const [totalPrice, setTotalPrice] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [includeAirportTransfer, setIncludeAirportTransfer] = useState(false);
  const [selectedAirportTransfer, setSelectedAirportTransfer] = useState('');
  const [airportTransfers, setAirportTransfers] = useState([]);
  const [airportTransferLoading, setAirportTransferLoading] = useState(false);
  const [airportTransferPrice, setAirportTransferPrice] = useState(0);
  const [tripType, setTripType] = useState('one-way');

  const showDurationSelection = () => {
    return (
      activity.pricingType === 'half-full-day' ||
      activity.halfDayPrice ||
      activity.fullDayPrice
    );
  };

  const getCurrentPrice = () => {
    if (showDurationSelection()) {
      return selectedDuration === 'halfDay'
        ? activity.halfDayPrice || activity.price
        : activity.fullDayPrice || activity.price;
    }
    return activity.price;
  };

  useEffect(() => {
    const fetchAirportTransfers = async () => {
      if (!includeAirportTransfer) return;

      try {
        setAirportTransferLoading(true);
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const response = await fetch(`${baseUrl}/airport-transfers/active`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setAirportTransfers(data.data);
            setSelectedAirportTransfer(data.data[0]._id);
            const initialPrice = tripType === 'one-way' 
              ? data.data[0].oneWayPrice 
              : data.data[0].roundTripPrice;
            setAirportTransferPrice(initialPrice);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setAirportTransferLoading(false);
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
    
    if (selectedAirportTransfer && airportTransfers.length > 0) {
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
      days.push({ date, isCurrentMonth: false, isPast: date < today, isToday: date.toDateString() === today.toDateString(), formatted: date.toISOString().split('T')[0] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({ date, isCurrentMonth: true, isPast, isToday: date.toDateString() === today.toDateString(), formatted: date.toISOString().split('T')[0] });
    }

    const totalCells = 42;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isPast: false, isToday: false, formatted: date.toISOString().split('T')[0] });
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
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Select a date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sticky top-24">
      {/* Price Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold">${getCurrentPrice()}</div>
            <div className="text-sm opacity-90 mt-1">per person</div>
          </div>
          {showDurationSelection() && (
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium">
              {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Duration Selection */}
        {showDurationSelection() && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select Duration
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedDuration('halfDay')}
                className={`group relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  selectedDuration === 'halfDay'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="text-left">
                  <div className={`font-bold text-lg mb-1 ${
                    selectedDuration === 'halfDay' ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    Half Day
                  </div>
                  <div className={`text-2xl font-bold ${
                    selectedDuration === 'halfDay' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    ${activity.halfDayPrice || activity.price}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">4-5 hours</div>
                </div>
                {selectedDuration === 'halfDay' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedDuration('fullDay')}
                className={`group relative p-5 rounded-xl border-2 transition-all duration-300 ${
                  selectedDuration === 'fullDay'
                    ? 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-cyan-100 shadow-lg'
                    : 'border-gray-200 hover:border-cyan-300 hover:shadow-md'
                }`}
              >
                <div className="text-left">
                  <div className={`font-bold text-lg mb-1 ${
                    selectedDuration === 'fullDay' ? 'text-cyan-700' : 'text-gray-900'
                  }`}>
                    Full Day
                  </div>
                  <div className={`text-2xl font-bold ${
                    selectedDuration === 'fullDay' ? 'text-cyan-600' : 'text-gray-600'
                  }`}>
                    ${activity.fullDayPrice || activity.price}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">8-9 hours</div>
                </div>
                {selectedDuration === 'fullDay' && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Select Date
          </label>

          <div className="relative">
            <div
              className="w-full px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all duration-300 group"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className={`font-medium ${selectedDate ? 'text-gray-900' : 'text-gray-500'}`}>
                    {selectedDate ? formatDateDisplay(selectedDate) : 'Choose your date'}
                  </div>
                  <div className="text-sm text-gray-500">Click to select</div>
                </div>
              </div>
              <svg className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showCalendar && (
              <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-lg font-bold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-sm text-gray-500 font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {generateCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      disabled={day.isPast}
                      className={`
                        h-10 rounded-lg text-sm font-medium transition-all duration-200
                        ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${day.isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                        ${selectedDate === day.formatted 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transform scale-105' 
                          : ''}
                        ${day.isToday && !selectedDate 
                          ? 'border-2 border-blue-400 text-blue-600 bg-blue-50' 
                          : ''}
                        ${!day.isCurrentMonth ? 'opacity-50' : ''}
                      `}
                    >
                      {day.date.getDate()}
                      {day.isToday && !selectedDate && (
                        <div className="w-1 h-1 bg-blue-400 rounded-full mx-auto mt-1"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Airport Transfer */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Add Airport Transfer</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Seamless transportation to your activity</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAirportTransfer}
                onChange={(e) => setIncludeAirportTransfer(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
          </div>

          {includeAirportTransfer && (
            <div className="space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100">
              {airportTransferLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <span className="text-gray-600">Loading airport transfers...</span>
                </div>
              ) : airportTransfers.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No transfers available at the moment</p>
                </div>
              ) : (
                <>
                  {/* Trip Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Trip Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleTripTypeChange('one-way')}
                        className={`group p-4 rounded-xl border-2 transition-all duration-300 ${
                          tripType === 'one-way'
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`font-bold text-lg mb-1 ${
                            tripType === 'one-way' ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            One Way
                          </div>
                          <div className="text-sm text-gray-600">Airport to hotel</div>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleTripTypeChange('round-trip')}
                        className={`group p-4 rounded-xl border-2 transition-all duration-300 ${
                          tripType === 'round-trip'
                            ? 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-cyan-100 shadow-lg'
                            : 'border-gray-200 hover:border-cyan-300 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`font-bold text-lg mb-1 ${
                            tripType === 'round-trip' ? 'text-cyan-700' : 'text-gray-900'
                          }`}>
                            Round Trip
                          </div>
                          <div className="text-sm text-gray-600">Return included</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Airport Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Select Transfer</label>
                    <div className="space-y-3">
                      {airportTransfers.map((transfer) => (
                        <label
                          key={transfer._id}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                            selectedAirportTransfer === transfer._id
                              ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-white shadow-md'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                              selectedAirportTransfer === transfer._id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedAirportTransfer === transfer._id && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {transfer.airportName}
                                {transfer.airportCode && (
                                  <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    {transfer.airportCode}
                                  </span>
                                )}
                              </div>
                              {transfer.location && (
                                <div className="text-sm text-gray-600 flex items-center mt-1">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {transfer.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">
                              ${tripType === 'one-way' ? transfer.oneWayPrice : transfer.roundTripPrice}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {transfer.capacity} people • {transfer.estimatedTime}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="airportTransfer"
                            value={transfer._id}
                            checked={selectedAirportTransfer === transfer._id}
                            onChange={handleAirportTransferChange}
                            className="hidden"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-900 text-lg mb-6">Price Summary</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <div className="font-medium text-gray-900">{activity.title}</div>
                {showDurationSelection() && (
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'} Package
                  </div>
                )}
              </div>
              <div className="font-bold text-lg text-gray-900">${getCurrentPrice()}</div>
            </div>

            {includeAirportTransfer && airportTransferPrice > 0 && (
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">Airport Transfer</div>
                  {selectedAirportTransfer && airportTransfers.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {airportTransfers.find(t => t._id === selectedAirportTransfer)?.airportName}
                      {' • '}
                      {tripType === 'one-way' ? 'One Way' : 'Round Trip'}
                    </div>
                  )}
                </div>
                <div className="font-bold text-lg text-blue-600">+${airportTransferPrice}</div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <div className="font-bold text-xl text-gray-900">Total Amount</div>
              <div className="text-right">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  ${totalPrice}
                </div>
                <div className="text-sm text-gray-600 mt-1">Inclusive of all fees</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedDate}
          className={`
            group w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1
            ${selectedDate
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-cyan-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-md'
            }
          `}
        >
          <div className="flex items-center justify-center">
            {selectedDate ? (
              <>
                <span>Continue to Booking</span>
                <svg className="w-6 h-6 ml-3 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            ) : (
              'Select a Date First'
            )}
          </div>
        </button>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="font-medium text-green-700 mb-1">Flexible Cancellation</div>
            <div className="text-xs text-green-600">Free 24h cancellation</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="font-medium text-blue-700 mb-1">Secure Payment</div>
            <div className="text-xs text-blue-600">100% protected</div>
          </div>
        </div>
      </form>
    </div>
  );
};

// Add CSS animation
const style = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;

export default BookingForm;