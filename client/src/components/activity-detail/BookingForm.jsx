import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BookingForm = ({ activity }) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [guests, setGuests] = useState(2);
    const [selectedDuration, setSelectedDuration] = useState('halfDay');
    const [totalPrice, setTotalPrice] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // Debug: Log activity data
    useEffect(() => {
        console.log('📊 Activity Data in BookingForm:', activity);
        console.log('📊 Pricing Type:', activity?.pricingType);
        console.log('📊 Half Day Price:', activity?.halfDayPrice);
        console.log('📊 Full Day Price:', activity?.fullDayPrice);
        console.log('📊 Base Price:', activity?.price);
    }, [activity]);
    
    const maxGuests = activity.maxParticipants || 10;
    
    // Check if we should show duration selection
    const showDurationSelection = () => {
        return activity.pricingType === 'half-full-day' || 
               activity.halfDayPrice || 
               activity.fullDayPrice;
    };
    
    // Calculate price based on selection
    const getCurrentPrice = () => {
        if (showDurationSelection()) {
            return selectedDuration === 'halfDay' 
                ? (activity.halfDayPrice || activity.price)
                : (activity.fullDayPrice || activity.price);
        }
        return activity.price;
    };
    
    // Update total price when guests, activity, or duration changes
    useEffect(() => {
        const pricePerPerson = getCurrentPrice();
        setTotalPrice(pricePerPerson * guests);
    }, [guests, activity, selectedDuration]);
    
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
                guests,
                selectedDuration,
                selectedPrice: getCurrentPrice()
            }
        });
    };
    
    // Handle guest increment/decrement
    const incrementGuests = () => {
        if (guests < maxGuests) {
            setGuests(prev => prev + 1);
        }
    };
    
    const decrementGuests = () => {
        if (guests > 1) {
            setGuests(prev => prev - 1);
        }
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
                formatted: date.toISOString().split('T')[0]
            });
        }
        
        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            days.push({
                date,
                isCurrentMonth: true,
                isPast: isPast,
                isToday: date.toDateString() === today.toDateString(),
                formatted: date.toISOString().split('T')[0]
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
                formatted: date.toISOString().split('T')[0]
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
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    const nextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const formatDateDisplay = (dateString) => {
        if (!dateString) return 'Select a date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
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
                        <label className="block text-gray-700 font-medium mb-3">Select Duration</label>
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
                    <label className="block text-gray-700 font-medium mb-3">Select Date</label>
                    
                    {/* Selected Date Display */}
                    <div 
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span className={`${selectedDate ? 'text-gray-900' : 'text-gray-500'}`}>
                                {formatDateDisplay(selectedDate)}
                            </span>
                        </div>
                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
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
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <div className="text-lg font-semibold text-gray-800">
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                                <button
                                    type="button"
                                    onClick={nextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
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
                                            h-10 rounded-lg transition-all duration-200 text-sm font-medium
                                            ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                                            ${day.isPast ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-50 hover:scale-105'}
                                            ${selectedDate === day.formatted ? 'bg-blue-600 text-white hover:bg-blue-700 scale-105' : ''}
                                            ${day.isToday && !selectedDate ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                                        `}
                                    >
                                        {day.date.getDate()}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Quick Date Selection */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="text-sm font-medium text-gray-700 mb-2">Quick Select</div>
                                <div className="flex space-x-2">
                                    {[1, 3, 7].map(days => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + days);
                                        const formatted = date.toISOString().split('T')[0];
                                        return (
                                            <button
                                                key={days}
                                                type="button"
                                                onClick={() => handleDateSelect({
                                                    date,
                                                    isPast: false,
                                                    formatted
                                                })}
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
                
                {/* Number of Guests with +/- buttons */}
                <div>
                    <label className="block text-gray-700 font-medium mb-3">Number of Guests</label>
                    <div className="flex items-center">
                        <div className="flex-1 bg-white border-2 border-gray-300 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0A9 9 0 008.5 3M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <span className="text-gray-900 font-medium">{guests} {guests === 1 ? 'guest' : 'guests'}</span>
                                </div>
                                
                                {/* +/- Buttons */}
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={decrementGuests}
                                        disabled={guests <= 1}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center transition-all
                                            ${guests <= 1 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-110'
                                            }
                                        `}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                        </svg>
                                    </button>
                                    
                                    <div className="w-12 text-center font-bold text-xl text-gray-800">
                                        {guests}
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={incrementGuests}
                                        disabled={guests >= maxGuests}
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center transition-all
                                            ${guests >= maxGuests 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-110'
                                            }
                                        `}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 pl-2">
                        Maximum {maxGuests} guests allowed
                    </div>
                </div>
                
                {/* Price Calculation */}
                <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-5 border border-blue-100">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">
                                {showDurationSelection() ? (
                                    <>
                                        {selectedDuration === 'halfDay' ? 'Half Day' : 'Full Day'} rate
                                        <span className="text-sm text-gray-500 ml-2">× {guests} guests</span>
                                    </>
                                ) : (
                                    <>
                                        ${getCurrentPrice()} per person
                                        <span className="text-sm text-gray-500 ml-2">× {guests} guests</span>
                                    </>
                                )}
                            </span>
                            <span className="font-medium">${getCurrentPrice() * guests}</span>
                        </div>
                        
                        {/* Optional: Add taxes/fees if needed */}
                        {/* <div className="flex justify-between text-sm text-gray-600">
                            <span>Taxes & fees</span>
                            <span>$0.00</span>
                        </div> */}
                        
                        <div className="border-t border-blue-200 pt-3">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-bold text-blue-800">Total</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-800">${totalPrice}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Pay at checkout
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
                        ${selectedDate 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {selectedDate ? (
                        <>
                            <span>Continue to Book</span>
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                        </>
                    ) : (
                        'Select a date to continue'
                    )}
                </button>
                
                {/* Booking Info */}
                <div className="text-center space-y-2">
                    <p className="text-gray-500 text-sm">
                        <svg className="w-4 h-4 inline mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Free cancellation up to 24 hours before
                    </p>
                    <p className="text-gray-500 text-sm">
                        <svg className="w-4 h-4 inline mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Secure payment processing
                    </p>
                </div>
            </form>
        </div>
    );
};

export default BookingForm;