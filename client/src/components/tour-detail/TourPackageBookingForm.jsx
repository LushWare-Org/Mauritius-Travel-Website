// components/tour-detail/TourPackageBookingForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivitySelector from './ActivitySelector';
import { activitiesAPI, airportTransferAPI } from '../../utils/api'; 
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaPlus, 
  FaMinus, 
  FaChevronDown, 
  FaChevronUp, 
  FaPlane,
  FaClock,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaArrowRight,
  FaRegClock,
  FaExchangeAlt,
  FaLongArrowAltRight
} from 'react-icons/fa';

const TourPackageBookingForm = ({ tour }) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(null);
    const [guests, setGuests] = useState(2);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [selectedActivitiesDetails, setSelectedActivitiesDetails] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    
    // Activity State
    const [activityDurations, setActivityDurations] = useState({});
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityFilter, setActivityFilter] = useState('');
    
    // Airport Transfer State
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

    // Fetch all activities
    useEffect(() => {
        const fetchAllActivities = async () => {
            try {
                const response = await activitiesAPI.getAll();
                if (response.data.success) {
                    const allActivities = response.data.data || [];
                    
                    const initialDurations = {};
                    allActivities.forEach(activity => {
                        if (activity.halfDayPrice || activity.fullDayPrice) {
                            initialDurations[activity._id] = 'halfDay';
                        }
                    });
                    setActivityDurations(initialDurations);
                }
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        };
        fetchAllActivities();
    }, []);

    // Update selected activities details
    useEffect(() => {
        if (selectedActivities.length === 0) {
            setSelectedActivitiesDetails([]);
            return;
        }
        
        const fetchActivityDetails = async () => {
            try {
                const response = await activitiesAPI.getAll();
                if (response.data.success) {
                    const details = response.data.data.filter(activity => 
                        selectedActivities.includes(activity._id)
                    );
                    setSelectedActivitiesDetails(details);
                }
            } catch (error) {
                console.error('Error fetching activity details:', error);
            }
        };
        
        fetchActivityDetails();
    }, [selectedActivities]);

    // Check if activity supports duration selection
    const showDurationSelection = (activity) => {
        return activity.halfDayPrice || activity.fullDayPrice;
    };

    // Get activity price based on duration
    const getActivityPrice = (activity) => {
        if (showDurationSelection(activity)) {
            const duration = activityDurations[activity._id] || 'halfDay';
            return duration === 'halfDay' 
                ? Number(activity.halfDayPrice || activity.price) 
                : Number(activity.fullDayPrice || activity.price);
        }
        return Number(activity.price) || 0;
    };

    // Handle duration change
    const handleDurationChange = (activityId, duration) => {
        setActivityDurations(prev => ({
            ...prev,
            [activityId]: duration
        }));
    };

    // Price calculation
    useEffect(() => {
        const calculateTotalPrice = () => {
            const packageTotal = basePrice * guests;
            
            let activitiesTotal = 0;
            if (selectedActivitiesDetails.length > 0) {
                activitiesTotal = selectedActivitiesDetails.reduce((sum, activity) => {
                    const activityPrice = getActivityPrice(activity);
                    return sum + (activityPrice * guests);
                }, 0);
            }
            
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
    }, [guests, basePrice, selectedActivitiesDetails, activityDurations, includeTransfer, selectedTransfer, transferTripType]);

    // Handle trip type change
    const handleTripTypeChange = (type) => {
        setTransferTripType(type);
    };

    // Get transfer price based on trip type
    const getTransferPrice = (transfer) => {
        if (!transfer) return 0;
        return transferTripType === 'one-way' 
            ? parseFloat(transfer.oneWayPrice) || 0
            : parseFloat(transfer.roundTripPrice) || 0;
    };

    // Format airport transfer option for dropdown
    const formatTransferOption = (transfer) => {
        const airportCode = transfer.airportCode || '';
        const airportName = transfer.airportName || '';
        const price = getTransferPrice(transfer);
        
        let display = '';
        if (airportCode) display += `${airportCode} - `;
        if (airportName) display += airportName;
        if (price) display += ` - Rs ${price.toFixed(2)}`;
        
        return display;
    };

        // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        if (!selectedDate) {
            alert('Please select a date');
            return;
        }

        if (includeTransfer && !selectedTransfer) {
            alert('Please select an airport transfer');
            return;
        }

        setIsSubmitting(true);

        try {
            const finalPackageTotal = basePrice * guests;
            
            const finalActivitiesTotal = selectedActivitiesDetails.reduce(
                (sum, activity) => {
                    const activityPrice = getActivityPrice(activity);
                    return sum + (activityPrice * guests);
                },
                0
            );
            
            let finalTransferTotal = 0;
            let transferDetails = null;
            if (includeTransfer && selectedTransfer) {
                finalTransferTotal = getTransferPrice(selectedTransfer);
                
                // Simplified transfer details - remove date/time requirements
                transferDetails = {
                    transferId: selectedTransfer._id,
                    transferName: selectedTransfer.airportName,
                    transferCode: selectedTransfer.airportCode,
                    vehicleType: selectedTransfer.vehicleType,
                    tripType: transferTripType,
                    transferType: transferType,
                    transferPrice: finalTransferTotal
                    // Removed arrivalDate, arrivalTime, departureDate, departureTime
                };
            }
            
            const finalTotal = finalPackageTotal + finalActivitiesTotal + finalTransferTotal;

            const activitiesDataForSubmission = selectedActivitiesDetails.map(activity => ({
                activity: activity._id,
                title: activity.title,
                price: getActivityPrice(activity),
                quantity: guests,
                duration: showDurationSelection(activity) ? activityDurations[activity._id] : null,
                durationType: showDurationSelection(activity) ? (activityDurations[activity._id] === 'halfDay' ? 'Half Day' : 'Full Day') : null
            }));

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

    // Format date display
    const formatDateDisplay = (date) => {
        if (!date) return 'Select date';
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        });
    };

    // Guest options
    const guestOptions = Array.from({ length: maxGuests }, (_, i) => i + 1);

    // Handle activity selection change
    const handleActivitiesChange = (activityIds) => {
        setSelectedActivities(activityIds);
    };

    // Calculate totals
    const packageTotal = basePrice * guests;
    const activitiesTotal = selectedActivitiesDetails.reduce(
        (sum, activity) => {
            const activityPrice = getActivityPrice(activity);
            return sum + (activityPrice * guests);
        },
        0
    );
    
    const transferTotal = includeTransfer && selectedTransfer ? getTransferPrice(selectedTransfer) : 0;

    // Custom date input
    const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
        <div 
            ref={ref}
            onClick={onClick}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer hover:border-blue-400 transition-colors flex justify-between items-center text-sm"
        >
            <div className="flex items-center">
                <FaCalendarAlt className="text-blue-500 mr-2 text-xs" />
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                    {value || 'Select date'}
                </span>
            </div>
            <FaChevronDown className="text-gray-400 text-xs" />
        </div>
    ));

    CustomInput.displayName = 'CustomInput';

    return (
        <>
            {/* Activity Selection Modal */}
            {showActivityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-4 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Select Activities</h2>
                                    <p className="text-gray-600 text-sm mt-1">Enhance your tour experience</p>
                                </div>
                                <button
                                    onClick={() => setShowActivityModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            
                            <div className="mt-4 flex gap-3">
                                <div className="flex-1 relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder="Search activities..."
                                        value={activityFilter}
                                        onChange={(e) => setActivityFilter(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-300 flex items-center gap-1 text-sm">
                                    <FaFilter className="text-xs" />
                                    Filter
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <ActivitySelector
                                selectedActivities={selectedActivities}
                                onActivitiesChange={handleActivitiesChange}
                                guests={guests}
                                filter={activityFilter}
                                activityDurations={activityDurations}
                                onDurationChange={handleDurationChange}
                            />
                        </div>
                        
                        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <div>
                                    <div className="text-xs text-gray-600">Selected Activities</div>
                                    <div className="font-bold">{selectedActivities.length} activities</div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowActivityModal(false)}
                                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setShowActivityModal(false)}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        Done Selecting
                                        <FaArrowRight className="text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Booking Form */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">Book This Tour</h2>
                            <p className="opacity-90 text-xs mt-1">Secure your spot with instant confirmation</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">Rs {basePrice.toFixed(2)}</div>
                            <div className="text-xs opacity-90">per person</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Date and Guests - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Date Selection */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1.5 text-sm">
                                <FaCalendarAlt className="inline mr-1.5 text-blue-500 text-xs" />
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
                                dateFormat="MMM d, yyyy"
                                placeholderText="Select a date"
                                required
                                className="w-full"
                                popperClassName="z-50"
                                popperPlacement="bottom-start"
                            />
                            
                            {selectedDate && (
                                <div className="mt-1.5 p-1.5 bg-blue-50 rounded border border-blue-100 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <FaCheck className="text-green-500 mr-1.5 text-xs" />
                                            <span className="font-medium text-gray-800">{formatDateDisplay(selectedDate)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDate(null)}
                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Number of Guests */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1.5 text-sm">
                                <FaUsers className="inline mr-1.5 text-green-500 text-xs" />
                                Number of Guests
                            </label>
                            <div className="flex items-center space-x-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setGuests(prev => Math.max(1, prev - 1))}
                                    disabled={guests <= 1}
                                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaMinus className="text-xs" />
                                </button>
                                
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold text-gray-900">{guests}</div>
                                    <div className="text-xs text-gray-600">
                                        {guests === 1 ? 'Guest' : 'Guests'}
                                    </div>
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={() => setGuests(prev => Math.min(maxGuests, prev + 1))}
                                    disabled={guests >= maxGuests}
                                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaPlus className="text-xs" />
                                </button>
                            </div>
                            
                            <div>
                                <select
                                    value={guests}
                                    onChange={(e) => setGuests(parseInt(e.target.value))}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                >
                                    {guestOptions.map((num) => (
                                        <option key={num} value={num}>
                                            {num} {num === 1 ? 'Guest' : 'Guests'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Selected Activities with Duration Selection */}
                    {selectedActivitiesDetails.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-800 text-sm flex items-center">
                                    <FaClock className="text-blue-500 mr-1.5 text-xs" />
                                    Selected Activities
                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                        {selectedActivities.length}
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                {selectedActivitiesDetails.map(activity => {
                                    const price = getActivityPrice(activity);
                                    const activityTotal = price * guests;
                                    const supportsDuration = showDurationSelection(activity);
                                    
                                    return (
                                        <div key={activity._id} className="p-3 hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800 text-sm">
                                                        {activity.title}
                                                    </div>
                                                    <div className="text-gray-600 text-xs mt-0.5">
                                                        {activity.description?.substring(0, 60)}...
                                                    </div>
                                                    
                                                    {/* Duration Selection for Activities */}
                                                    {supportsDuration && (
                                                        <div className="mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <FaRegClock className="text-blue-500 text-xs" />
                                                                <span className="text-xs font-medium text-gray-700">Duration:</span>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDurationChange(activity._id, 'halfDay')}
                                                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                                                            activityDurations[activity._id] === 'halfDay'
                                                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                        }`}
                                                                    >
                                                                        Half Day
                                                                        {activity.halfDayPrice && (
                                                                            <span className="ml-1 font-semibold">
                                                                                (Rs {activity.halfDayPrice})
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDurationChange(activity._id, 'fullDay')}
                                                                        className={`px-2 py-1 text-xs rounded transition-colors ${
                                                                            activityDurations[activity._id] === 'fullDay'
                                                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                        }`}
                                                                    >
                                                                        Full Day
                                                                        {activity.fullDayPrice && (
                                                                            <span className="ml-1 font-semibold">
                                                                                (Rs {activity.fullDayPrice})
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {activityDurations[activity._id] === 'halfDay'
                                                                    ? 'Approximately 4-5 hours'
                                                                    : 'Approximately 8-9 hours'
                                                                }
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="text-right ml-3">
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        Rs {activityTotal.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Rs {price.toFixed(2)} × {guests}
                                                    </div>
                                                    {supportsDuration && (
                                                        <div className="text-xs text-blue-600 mt-1 font-medium">
                                                            {activityDurations[activity._id] === 'halfDay' ? 'Half Day' : 'Full Day'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowActivityModal(true)}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                        Edit Activities
                                    </button>
                                    <div className="text-sm font-bold text-gray-800">
                                        Activities Total: Rs {activitiesTotal.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Activities Button */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setShowActivityModal(true)}
                            className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors font-medium text-sm"
                        >
                            <div className="flex items-center justify-center">
                                <FaPlus className="mr-2 text-xs" />
                                {selectedActivities.length > 0 
                                    ? 'Add More Activities' 
                                    : 'Add Activities to Your Tour'
                                }
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                                Customize your experience with optional activities
                            </p>
                        </button>
                    </div>

                    {/* Airport Transfer Section - MORE COMPACT */}
<div className="border border-gray-200 rounded-lg p-2">
    <div className="flex justify-between items-center">
        <div className="flex items-center">
            <FaPlane className="text-blue-500 mr-2 text-xs" />
            <div>
                <h3 className="font-medium text-gray-800 text-xs">Airport Transfer</h3>
                <p className="text-gray-500 text-[10px]">Optional transportation</p>
            </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={includeTransfer}
                onChange={(e) => setIncludeTransfer(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-8 h-4 bg-gray-300 peer-checked:bg-blue-600 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
        </label>
    </div>
    
    {includeTransfer && (
        <div className="mt-2 space-y-2">
            {/* Trip Type Selection - COMPACT */}
            <div>
                <div className="flex items-center text-[10px] text-gray-600 mb-1.5">
                    <FaExchangeAlt className="text-blue-500 mr-1 text-xs" />
                    <span className="font-medium">Trip Type</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        type="button"
                        onClick={() => handleTripTypeChange('one-way')}
                        className={`p-1.5 rounded border transition-all flex items-center justify-center ${
                            transferTripType === 'one-way'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        <FaLongArrowAltRight className={`mr-1 text-xs ${
                            transferTripType === 'one-way' ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <span className="text-xs font-medium">One Way</span>
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => handleTripTypeChange('round-trip')}
                        className={`p-1.5 rounded border transition-all flex items-center justify-center ${
                            transferTripType === 'round-trip'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        <FaExchangeAlt className={`mr-1 text-xs ${
                            transferTripType === 'round-trip' ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <span className="text-xs font-medium">Round Trip</span>
                    </button>
                </div>
            </div>

            {/* Transfer Selection */}
            <div>
                <div className="text-[10px] font-medium text-gray-600 mb-1">Select Transfer</div>
                {loadingTransfers ? (
                    <div className="text-center py-1.5">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                    </div>
                ) : availableTransfers.length > 0 ? (
                    <select
                        value={selectedTransfer?._id || ''}
                        onChange={(e) => {
                            const transfer = availableTransfers.find(t => t._id === e.target.value);
                            setSelectedTransfer(transfer || null);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
                    >
                        <option value="">Choose transfer...</option>
                        {availableTransfers.map((transfer) => (
                            <option key={transfer._id} value={transfer._id}>
                                {transfer.airportCode ? `${transfer.airportCode} - ` : ''}
                                {transfer.airportName.substring(0, 20)}
                                {` - Rs ${getTransferPrice(transfer).toFixed(0)}`}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="text-center py-1.5 bg-gray-50 rounded border border-gray-200">
                        <p className="text-gray-500 text-xs">No transfers available</p>
                    </div>
                )}
            </div>

            {/* Selected Transfer Details - COMPACT */}
            {selectedTransfer && (
                <div className="bg-blue-50 rounded p-2 border border-blue-100">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 pr-2">
                            <div className="flex items-center">
                                <FaPlane className="text-blue-600 mr-1 text-xs" />
                                <div>
                                    <div className="font-bold text-gray-800 text-xs truncate">
                                        {selectedTransfer.airportName}
                                    </div>
                                    <div className="text-gray-600 text-[10px] flex items-center gap-1 mt-0.5">
                                        <span className="bg-blue-200 text-blue-800 px-1 py-0.5 rounded font-medium">
                                            {selectedTransfer.airportCode}
                                        </span>
                                        <span>•</span>
                                        <span>{selectedTransfer.vehicleType}</span>
                                        <span>•</span>
                                        <span className={`px-1 py-0.5 rounded font-medium ${
                                            transferTripType === 'one-way' 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-purple-100 text-purple-800'
                                        }`}>
                                            {transferTripType === 'one-way' ? 'One Way' : 'Round Trip'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                            <div className="font-bold text-blue-600 text-sm">
                                Rs {getTransferPrice(selectedTransfer).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )}
</div>

                    {/* Price Breakdown - UPDATED WITH TRANSFER */}
                    <div className="border border-gray-200 rounded-lg p-3">
                        <h3 className="font-semibold text-gray-800 text-sm mb-2">Price Summary</h3>
                        
                        <div className="space-y-2">
                            {/* Package Price */}
                            <div className="flex justify-between items-center py-1">
                                <div>
                                    <div className="font-medium text-gray-800 text-sm">Tour Package</div>
                                    <div className="text-gray-600 text-xs">Rs {basePrice.toFixed(2)} × {guests} guests</div>
                                </div>
                                <div className="font-bold text-gray-900">Rs {packageTotal.toFixed(2)}</div>
                            </div>
                            
                            {/* Activities Total */}
                            {selectedActivitiesDetails.length > 0 && (
                                <div className="flex justify-between items-center py-1 border-t border-gray-100">
                                    <div>
                                        <div className="font-medium text-gray-800 text-sm">Activities</div>
                                        <div className="text-gray-600 text-xs">
                                            {selectedActivities.length} activity(s)
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-900">Rs {activitiesTotal.toFixed(2)}</div>
                                </div>
                            )}
                            
                            {/* Transfer Price */}
                            {includeTransfer && selectedTransfer && (
                                <div className="flex justify-between items-center py-1 border-t border-gray-100">
                                    <div>
                                        <div className="font-medium text-gray-800 text-sm">Airport Transfer</div>
                                        <div className="text-gray-600 text-xs">
                                            {selectedTransfer.airportCode} • {transferTripType === 'one-way' ? 'One Way' : 'Round Trip'}
                                        </div>
                                    </div>
                                    <div className="font-bold text-blue-600">Rs {transferTotal.toFixed(2)}</div>
                                </div>
                            )}
                        </div>
                        
                        {/* Total */}
                        <div className="border-t border-gray-300 mt-3 pt-3">
                            <div className="flex justify-between items-center">
                                <div className="font-bold text-gray-900 text-lg">Total Amount</div>
                                <div className="text-2xl font-bold text-blue-600">Rs {totalPrice.toFixed(2)}</div>
                            </div>
                            <p className="text-gray-500 text-xs mt-1 text-center">
                                <FaCheck className="inline mr-1 text-green-500 text-sm" />
                                Complete booking on next page
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={isSubmitting || !selectedDate}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <span>Continue to Book</span>
                                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </>
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