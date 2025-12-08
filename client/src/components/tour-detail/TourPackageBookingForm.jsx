// Add to your existing TourPackageBookingForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivitySelector from './ActivitySelector';
import { activitiesAPI, airportTransferAPI } from '../../utils/api'; 
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TourPackageBookingForm = ({ tour }) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(null);
    const [guests, setGuests] = useState(2);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [selectedActivitiesDetails, setSelectedActivitiesDetails] = useState([]);
    const [showActivitySelector, setShowActivitySelector] = useState(false);
    const [allActivitiesData, setAllActivitiesData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    
    // NEW: Airport Transfer State
    const [includeTransfer, setIncludeTransfer] = useState(false);
    const [availableTransfers, setAvailableTransfers] = useState([]);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [transferTripType, setTransferTripType] = useState('one-way');
    const [arrivalDate, setArrivalDate] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [transferType, setTransferType] = useState('airport-to-hotel');
    const [loadingTransfers, setLoadingTransfers] = useState(false);

    const basePrice = Number(tour.price) || 0;
    const [totalPrice, setTotalPrice] = useState(basePrice * guests);
    const maxGuests = tour.maxParticipants || 10;

    // Fetch airport transfers
    useEffect(() => {
        const fetchTransfers = async () => {
            try {
                setLoadingTransfers(true);
                const response = await airportTransferAPI.getActive();
                if (response.data.success) {
                    setAvailableTransfers(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching transfers:', error);
            } finally {
                setLoadingTransfers(false);
            }
        };
        fetchTransfers();
    }, []);

    // Fetch all activities once when component mounts
    useEffect(() => {
        const fetchAllActivities = async () => {
            try {
                const response = await activitiesAPI.getAll();
                if (response.data.success) {
                    setAllActivitiesData(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        };
        fetchAllActivities();
    }, []);

    // Update selectedActivitiesDetails whenever selectedActivities changes
    useEffect(() => {
        if (selectedActivities.length === 0) {
            setSelectedActivitiesDetails([]);
            return;
        }
        
        // Filter activities from allActivitiesData that match selected IDs
        const details = allActivitiesData.filter(activity => 
            selectedActivities.includes(activity._id)
        );
        
        setSelectedActivitiesDetails(details);
    }, [selectedActivities, allActivitiesData]);

    // Price calculation useEffect - UPDATED to include transfer
    useEffect(() => {
        const calculateTotalPrice = () => {
            const packageTotal = basePrice * guests;
            
            // Calculate activities total
            let activitiesTotal = 0;
            if (selectedActivitiesDetails.length > 0) {
                activitiesTotal = selectedActivitiesDetails.reduce((sum, activity) => {
                    const activityPrice = Number(activity.price) || 0;
                    return sum + (activityPrice * guests);
                }, 0);
            }
            
            // Calculate transfer total
            let transferTotal = 0;
            if (includeTransfer && selectedTransfer) {
                if (transferTripType === 'one-way') {
                    transferTotal = parseFloat(selectedTransfer.oneWayPrice) || 0;
                } else {
                    transferTotal = parseFloat(selectedTransfer.roundTripPrice) || 0;
                }
            }
            
            const total = packageTotal + activitiesTotal + transferTotal;
            setTotalPrice(total);
        };
  
        calculateTotalPrice();
    }, [guests, basePrice, selectedActivitiesDetails, includeTransfer, selectedTransfer, transferTripType]);

    // Handle form submission - UPDATED to include transfer
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        if (!selectedDate) {
            alert('Please select a date');
            return;
        }

        // Validate transfer details if included
        if (includeTransfer) {
            if (!selectedTransfer) {
                alert('Please select an airport transfer');
                return;
            }
            if (!arrivalDate || !arrivalTime) {
                alert('Please provide arrival date and time for transfer');
                return;
            }
            if (transferTripType === 'round-trip' && (!departureDate || !departureTime)) {
                alert('Please provide departure date and time for round-trip transfer');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Calculate final totals
            const finalPackageTotal = basePrice * guests;
            const finalActivitiesTotal = selectedActivitiesDetails.reduce(
                (sum, activity) => sum + (Number(activity.price) || 0) * guests,
                0
            );
            
            // Calculate transfer total
            let finalTransferTotal = 0;
            let transferDetails = null;
            if (includeTransfer && selectedTransfer) {
                if (transferTripType === 'one-way') {
                    finalTransferTotal = parseFloat(selectedTransfer.oneWayPrice) || 0;
                } else {
                    finalTransferTotal = parseFloat(selectedTransfer.roundTripPrice) || 0;
                }
                
                transferDetails = {
                    transferId: selectedTransfer._id,
                    transferName: selectedTransfer.airportName,
                    transferCode: selectedTransfer.airportCode,
                    vehicleType: selectedTransfer.vehicleType,
                    tripType: transferTripType,
                    transferType: transferType,
                    arrivalDate,
                    arrivalTime,
                    departureDate: transferTripType === 'round-trip' ? departureDate : null,
                    departureTime: transferTripType === 'round-trip' ? departureTime : null,
                    transferPrice: finalTransferTotal
                };
            }
            
            const finalTotal = finalPackageTotal + finalActivitiesTotal + finalTransferTotal;

            // Prepare activities data for submission
            const activitiesDataForSubmission = selectedActivitiesDetails.map(activity => ({
                activity: activity._id,
                title: activity.title,
                price: Number(activity.price) || 0,
                quantity: guests
            }));

            console.log('Submitting booking with:', {
                activities: activitiesDataForSubmission,
                activitiesTotal: finalActivitiesTotal,
                transferDetails: transferDetails,
                transferTotal: finalTransferTotal,
                total: finalTotal
            });

            navigate(`/tour-package-booking-confirmation/${tour._id || tour.id}`, {
                state: {
                    selectedDate: selectedDate.toISOString().split('T')[0],
                    guests,
                    selectedActivities: selectedActivitiesDetails,
                    activitiesData: activitiesDataForSubmission,
                    includeTransfer,
                    transferDetails,
                    totalPrice: finalTotal,
                    basePrice,
                    activitiesTotal: finalActivitiesTotal,
                    transferTotal: finalTransferTotal,
                    packageTotal: finalPackageTotal
                }
            });
        } catch (error) {
            console.error('Error preparing submission:', error);
            alert('Error preparing booking. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format date for display
    const formatDateDisplay = (date) => {
        if (!date) return 'Select date';
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Guest options
    const guestOptions = Array.from({ length: maxGuests }, (_, i) => i + 1);

    // Handle activity selection change
    const handleActivitiesChange = (activityIds) => {
        setSelectedActivities(activityIds);
    };

    // Calculate totals for display
    const packageTotal = basePrice * guests;
    const activitiesTotal = selectedActivitiesDetails.reduce(
        (sum, activity) => sum + (Number(activity.price) || 0) * guests,
        0
    );
    
    // Calculate transfer total for display
    const transferTotal = includeTransfer && selectedTransfer ? 
        (transferTripType === 'one-way' ? 
            parseFloat(selectedTransfer.oneWayPrice) || 0 : 
            parseFloat(selectedTransfer.roundTripPrice) || 0) : 0;

    // Custom input component for the date picker
    const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
        <div 
            ref={ref}
            onClick={onClick}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-colors flex justify-between items-center"
        >
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                {value || 'Select date'}
            </span>
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
            >
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
        </div>
    ));

    CustomInput.displayName = 'CustomInput';

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
            {/* Price Section */}
            <div className="bg-blue-600 text-white p-4">
                <div className="text-2xl font-bold">Rs {basePrice.toFixed(2)}</div>
                <div className="text-sm opacity-75">per person</div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Select Date - Calendar Picker */}
                <div>
                    <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
                        Select Date
                    </label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                        }}
                        onCalendarOpen={() => setCalendarOpen(true)}
                        onCalendarClose={() => setCalendarOpen(false)}
                        open={calendarOpen}
                        customInput={<CustomInput />}
                        minDate={getTomorrow()}
                        maxDate={getMaxDate()}
                        filterDate={filterPassedDates}
                        dateFormat="MMMM d, yyyy"
                        placeholderText="Select a date"
                        required
                        className="w-full"
                        popperClassName="z-50"
                        popperPlacement="bottom-start"
                    />
                    
                    {/* Calendar helper text */}
                    {!selectedDate && (
                        <p className="text-xs text-gray-500 mt-1">
                            Select a date from the calendar
                        </p>
                    )}
                    
                    {/* Selected date display */}
                    {selectedDate && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center text-blue-700">
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-5 w-5 mr-2" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{formatDateDisplay(selectedDate)}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDate(null)}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                                Change date
                            </button>
                        </div>
                    )}
                </div>

                {/* Number of Guests */}
                <div>
                    <label htmlFor="guests" className="block text-gray-700 font-medium mb-2">
                        Number of Guests
                    </label>
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                            disabled={guests <= 1}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                        
                        <div className="flex-1 text-center">
                            <span className="text-2xl font-bold text-gray-800">{guests}</span>
                            <div className="text-sm text-gray-500">
                                {guests === 1 ? 'guest' : 'guests'}
                            </div>
                        </div>
                        
                        <button
                            type="button"
                            onClick={() => setGuests(prev => Math.min(maxGuests, prev + 1))}
                            disabled={guests >= maxGuests}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Guest selector as dropdown (alternative) */}
                    <div className="mt-2">
                        <select
                            id="guests"
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            {guestOptions.map((num) => (
                                <option key={num} value={num}>
                                    {num} {num === 1 ? 'guest' : 'guests'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Activity Selection Toggle */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800">Add Activities</h3>
                        <button
                            type="button"
                            onClick={() => setShowActivitySelector(!showActivitySelector)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            {showActivitySelector ? 'Hide' : 'Select Activities'}
                        </button>
                    </div>
                    
                    {showActivitySelector && (
                        <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                            <ActivitySelector
                                selectedActivities={selectedActivities}
                                onActivitiesChange={handleActivitiesChange}
                                guests={guests}
                            />
                        </div>
                    )}

                    {/* Selected Activities Preview */}
                    {selectedActivitiesDetails.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <h4 className="font-medium text-gray-700 mb-2">Selected Activities:</h4>
                            <ul className="space-y-2">
                                {selectedActivitiesDetails.map(activity => {
                                    const price = Number(activity.price) || 0;
                                    const activityTotal = price * guests;
                                    
                                    return (
                                        <li key={activity._id} className="text-sm text-gray-600 flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">{activity.title}</span>
                                                <div className="text-xs text-gray-500">
                                                    Rs {price.toFixed(2)} per person
                                                </div>
                                            </div>
                                            <span className="font-semibold">
                                                Rs {activityTotal.toFixed(2)}
                                                <div className="text-xs text-gray-500 text-right">
                                                    (Rs {price.toFixed(2)} × {guests})
                                                </div>
                                            </span>
                                        </li>
                                    );
                                })}
                                {selectedActivitiesDetails.length > 0 && (
                                    <li className="text-sm font-medium text-gray-700 flex justify-between pt-2 border-t">
                                        <span>Activities Subtotal:</span>
                                        <span>RS{activitiesTotal.toFixed(2)}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* NEW: Airport Transfer Section */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-800">Airport Transfer</h3>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-2">Add transfer</span>
                            <button
                                type="button"
                                onClick={() => setIncludeTransfer(!includeTransfer)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                    includeTransfer ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    includeTransfer ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                    
                    {includeTransfer && (
                        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-blue-50">
                            <div className="space-y-4">
                                {/* Transfer Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Airport Transfer
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {loadingTransfers ? (
                                            <div className="text-center py-4">
                                                <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
                                            </div>
                                        ) : availableTransfers.length > 0 ? (
                                            availableTransfers.map(transfer => (
                                                <div 
                                                    key={transfer._id}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                        selectedTransfer?._id === transfer._id 
                                                            ? 'border-blue-500 bg-blue-100' 
                                                            : 'border-gray-300 hover:border-blue-300'
                                                    }`}
                                                    onClick={() => setSelectedTransfer(transfer)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{transfer.airportName}</h4>
                                                            <p className="text-sm text-gray-600">{transfer.airportCode} • {transfer.vehicleType}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-blue-600">
                                                                Rs {transfer.oneWayPrice}
                                                            </div>
                                                            <div className="text-xs text-gray-500">One Way</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-2">No transfers available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Trip Type Selection */}
                                {selectedTransfer && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trip Type
                                            </label>
                                            <div className="flex space-x-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="tripType"
                                                        value="one-way"
                                                        checked={transferTripType === 'one-way'}
                                                        onChange={(e) => setTransferTripType(e.target.value)}
                                                        className="mr-2 text-blue-600"
                                                    />
                                                    <span>One Way</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="tripType"
                                                        value="round-trip"
                                                        checked={transferTripType === 'round-trip'}
                                                        onChange={(e) => setTransferTripType(e.target.value)}
                                                        className="mr-2 text-blue-600"
                                                    />
                                                    <span>Round Trip</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Transfer Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Transfer Direction
                                            </label>
                                            <select
                                                value={transferType}
                                                onChange={(e) => setTransferType(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            >
                                                <option value="airport-to-hotel">Airport to Hotel</option>
                                                <option value="hotel-to-airport">Hotel to Airport</option>
                                            </select>
                                        </div>

                                        {/* Arrival Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Arrival Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={arrivalDate}
                                                    onChange={(e) => setArrivalDate(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                    required
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Arrival Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={arrivalTime}
                                                    onChange={(e) => setArrivalTime(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Departure Details (for round trip) */}
                                        {transferTripType === 'round-trip' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Departure Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={departureDate}
                                                        onChange={(e) => setDepartureDate(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                                        required
                                                        min={arrivalDate || new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Departure Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={departureTime}
                                                        onChange={(e) => setDepartureTime(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Transfer Price Display */}
                                        <div className="pt-3 border-t">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Transfer Price:</span>
                                                <span className="font-bold text-blue-600">
                                                    Rs {transferTotal.toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Flat rate for all {guests} passengers
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Breakdown - UPDATED to include transfer */}
                <div className="border-t border-b border-gray-200 py-4 mt-4">
                    <div className="space-y-3">
                        {/* Package Price */}
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Tour Package:</span>
                            <div className="text-right">
                                <div className="font-medium">
                                    Rs {basePrice.toFixed(2)} × {guests} = Rs {packageTotal.toFixed(2)}
                                </div>
                            </div>
                        </div>
                        
                        {/* Activities Price */}
                        {selectedActivitiesDetails.map(activity => {
                            const price = Number(activity.price) || 0;
                            const activityTotal = price * guests;
                            return (
                                <div key={activity._id} className="flex justify-between text-sm pl-4">
                                    <span className="text-gray-600">{activity.title}:</span>
                                    <div className="text-right">
                                        <div>
                                            Rs {price.toFixed(2)} × {guests} = Rs {activityTotal.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Transfer Price */}
                        {includeTransfer && selectedTransfer && (
                            <div className="flex justify-between text-sm pl-4">
                                <span className="text-gray-600">Airport Transfer:</span>
                                <div className="text-right">
                                    <div>
                                        Rs {transferTotal.toFixed(2)} ({transferTripType.replace('-', ' ')})
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {selectedTransfer.airportName} • {selectedTransfer.vehicleType}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Total */}
                        <div className="flex justify-between text-blue-800 font-bold pt-2 border-t border-gray-300 text-lg">
                            <span>Total Amount</span>
                            <span>Rs {totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={isSubmitting || !selectedDate}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Processing...' : 'Continue to Book'}
                </button>

                <p className="text-gray-500 text-sm mt-4">
                    You won't be charged yet. Complete your booking on the next page.
                </p>
            </form>
        </div>
    );
};

// Add helper functions
const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
};

const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    return maxDate;
};

const isDateAvailable = (date) => {
    return true;
};

const filterPassedDates = (date) => {
    return isDateAvailable(date);
};

export default TourPackageBookingForm;