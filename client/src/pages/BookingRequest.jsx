import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { activitiesAPI, bookingsAPI, userBookingsAPI } from '../utils/api';
import ConfirmationModal from '../components/booking/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

const BookingRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // Country code state
    const [selectedCountryCode, setSelectedCountryCode] = useState('+1'); // Default to US/Canada
    
    // Country codes list
    const countryCodes = [
        { code: '+1', country: 'US/Canada' },
        { code: '+44', country: 'UK' },
        { code: '+61', country: 'Australia' },
        { code: '+91', country: 'India' },
        { code: '+81', country: 'Japan' },
        { code: '+49', country: 'Germany' },
        { code: '+33', country: 'France' },
        { code: '+86', country: 'China' },
        { code: '+82', country: 'South Korea' },
        { code: '+55', country: 'Brazil' },
        { code: '+34', country: 'Spain' },
        { code: '+39', country: 'Italy' },
        { code: '+7', country: 'Russia' },
        { code: '+52', country: 'Mexico' },
        { code: '+27', country: 'South Africa' },
        { code: '+31', country: 'Netherlands' },
        { code: '+41', country: 'Switzerland' },
        { code: '+46', country: 'Sweden' },
        { code: '+47', country: 'Norway' },
        { code: '+45', country: 'Denmark' },
        { code: '+358', country: 'Finland' },
        { code: '+353', country: 'Ireland' },
        { code: '+64', country: 'New Zealand' },
        { code: '+65', country: 'Singapore' },
        { code: '+60', country: 'Malaysia' },
        { code: '+62', country: 'Indonesia' },
        { code: '+63', country: 'Philippines' },
        { code: '+66', country: 'Thailand' },
        { code: '+84', country: 'Vietnam' },
        { code: '+971', country: 'UAE' },
        { code: '+972', country: 'Israel' },
        { code: '+90', country: 'Turkey' },
        { code: '+20', country: 'Egypt' },
        { code: '+234', country: 'Nigeria' },
        { code: '+254', country: 'Kenya' },
        { code: '+57', country: 'Colombia' },
        { code: '+51', country: 'Peru' },
        { code: '+54', country: 'Argentina' },
        { code: '+56', country: 'Chile' },
        // Add more as needed
    ];

    const [formData, setFormData] = useState({
        date: '',
        guests: 2,
        duration: 'halfDay',
        fullName: '',
        email: '',
        phone: '', // This will store the phone number digits
        specialRequests: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingReference, setBookingReference] = useState('');
    const [bookingId, setBookingId] = useState('');

    // Debug: Log activity data
    useEffect(() => {
        if (activity) {
            console.log('📊 Activity Data in BookingRequest:', {
                title: activity.title,
                price: activity.price,
                halfDayPrice: activity.halfDayPrice,
                fullDayPrice: activity.fullDayPrice,
                pricingType: activity.pricingType,
                duration: activity.duration,
                shouldShowDuration: shouldShowDurationSelection()
            });
        }
    }, [activity]);

    // Get pre-selected data from state if available
    useEffect(() => {
        const updates = {};
        
        if (location.state?.selectedDate) {
            updates.date = location.state.selectedDate;
            updates.guests = location.state.guests || 2;
            updates.duration = location.state.selectedDuration || 'halfDay';
        }
        
        // Prefill with logged-in user's data
        if (currentUser) {
            if (currentUser.email && !formData.email) {
                updates.email = currentUser.email;
            }
            if (currentUser.name && !formData.fullName) {
                updates.fullName = currentUser.name;
            }
            // Prefill phone if available
            if (currentUser.phone && !formData.phone) {
                const phoneWithoutCountryCode = extractPhoneNumber(currentUser.phone);
                updates.phone = phoneWithoutCountryCode;
            }
        }
        
        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, [location.state, currentUser]);

    // Fetch activity data
    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const activityResponse = await activitiesAPI.getById(id);
                const foundActivity = activityResponse.data.data;
                
                if (foundActivity) {
                    console.log('✅ Activity loaded in BookingRequest:', foundActivity.title);
                    console.log('💰 Pricing info:', {
                        basePrice: foundActivity.price,
                        halfDayPrice: foundActivity.halfDayPrice,
                        fullDayPrice: foundActivity.fullDayPrice,
                        pricingType: foundActivity.pricingType,
                        hasHalfDay: !!foundActivity.halfDayPrice,
                        hasFullDay: !!foundActivity.fullDayPrice
                    });
                    setActivity(foundActivity);
                }
            } catch (error) {
                console.error('Error fetching activity details:', error);
                setError('Failed to load activity details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchActivity();
        }
    }, [id]);

    // Extract phone number from formatted string (for pre-filling)
    const extractPhoneNumber = (phoneString) => {
        if (!phoneString) return '';
        // Remove all non-digit characters
        return phoneString.replace(/\D/g, '');
    };

    // Check if we should show duration selection
    const shouldShowDurationSelection = () => {
        if (!activity) return false;
        
        // Show if pricingType is 'half-full-day' OR if halfDayPrice/fullDayPrice exist
        return activity.pricingType === 'half-full-day' || 
               activity.halfDayPrice || 
               activity.fullDayPrice;
    };

    // Calculate price based on duration selection
    const getCurrentPrice = () => {
        if (!activity) return 0;
        
        if (shouldShowDurationSelection()) {
            return formData.duration === 'halfDay' 
                ? (activity.halfDayPrice || activity.price)
                : (activity.fullDayPrice || activity.price);
        }
        return activity.price;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle phone number input change
    const handlePhoneChange = (e) => {
        const { value } = e.target;
        // Remove any non-digit characters
        const digitsOnly = value.replace(/\D/g, '');
        // Allow up to 15 digits (maximum for international numbers)
        const limitedDigits = digitsOnly.slice(0, 15);
        setFormData({
            ...formData,
            phone: limitedDigits
        });
    };

    // Handle country code change
    const handleCountryCodeChange = (e) => {
        setSelectedCountryCode(e.target.value);
    };

    // Format phone number for display
    const formatPhoneNumber = (phoneNumber) => {
        if (!phoneNumber) return '';
        
        // Format based on length (optional formatting)
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Different formatting based on length
        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 6) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        } else if (cleaned.length <= 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
        } else {
            // For longer international numbers, just show groups of 3-4 digits
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})(\d+)?/, '($1) $2-$3 $4');
        }
    };

    // Validate phone number
    const validatePhone = (phoneNumber) => {
        // Remove all non-digit characters
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        // Check if it has at least 5 digits (minimum for a valid phone number)
        return digitsOnly.length >= 5 && digitsOnly.length <= 15;
    };

    const handleDurationChange = (duration) => {
        setFormData({
            ...formData,
            duration
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        
        // Validate phone number
        if (!validatePhone(formData.phone)) {
            setError('Please enter a valid phone number (5-15 digits)');
            setSubmitting(false);
            return;
        }
        
        // Generate a random booking reference
        const reference = `BOOK-${Math.floor(100000 + Math.random() * 900000)}`;
        
        try {
            // Calculate total price
            const pricePerPerson = getCurrentPrice();
            const totalPrice = pricePerPerson * formData.guests;
            
            // Format phone number for display
            const formattedPhone = formatPhoneNumber(formData.phone);
            
            // Create booking data object with formatted phone number
            const bookingData = {
                activityId: id,
                bookingReference: reference,
                date: formData.date,
                guests: parseInt(formData.guests),
                duration: formData.duration,
                fullName: formData.fullName,
                email: formData.email,
                phone: `${selectedCountryCode} ${formattedPhone}`,
                phoneDigits: formData.phone, // Store raw digits for searching
                countryCode: selectedCountryCode,
                specialRequests: formData.specialRequests,
                totalPrice: totalPrice,
                pricePerPerson: pricePerPerson,
                durationType: formData.duration === 'halfDay' ? 'Half Day' : 'Full Day'
            };
            
            console.log('📤 Sending booking data:', bookingData);
            
            // Send booking data to the API
            const response = await bookingsAPI.create(bookingData);
            
            if (response.data.success) {
                setBookingReference(reference);
                setBookingId(response.data.data._id);
                
                // Refresh dashboard data
                try {
                    await userBookingsAPI.getStats();
                    await userBookingsAPI.getUpcoming();
                    await userBookingsAPI.getHistory();
                } catch (refreshError) {
                    console.error('Error refreshing dashboard data:', refreshError);
                }
                
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            console.error('Error details:', error.response?.data);
            setError('Failed to create booking. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="text-xl font-bold mb-2">Activity Not Found</h2>
                    <p>Sorry, we couldn't find the activity you're looking for.</p>
                </div>
            </div>
        );
    }

    const showDurationSelection = shouldShowDurationSelection();
    const currentPrice = getCurrentPrice();

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-blue-800 mb-2 font-display">Complete Your Booking</h1>
                    <p className="text-gray-600 mb-8">Please review the details and fill in your information to complete your booking request.</p>
                    
                    {/* Activity Summary */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/4 mb-4 md:mb-0">
                                <img 
                                    src={activity.image} 
                                    alt={activity.title} 
                                    className="w-full h-32 object-cover rounded"
                                />
                            </div>
                            <div className="md:w-3/4 md:pl-6">
                                <h2 className="text-xl font-bold text-blue-700">{activity.title}</h2>
                                <div className="flex items-center mt-1 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="ml-1 text-sm text-gray-600">{activity.rating} ({activity.reviewCount} reviews)</span>
                                </div>
                                <div className="text-gray-700 mb-1">
                                    <span className="font-medium">Location:</span> {activity.location}
                                </div>
                                <div className="text-gray-700 mb-1">
                                    <span className="font-medium">Duration:</span> 
                                    {showDurationSelection 
                                        ? (formData.duration === 'halfDay' ? ' Half Day' : ' Full Day')
                                        : ` ${activity.duration} hour${activity.duration !== 1 ? 's' : ''}`}
                                </div>
                                <div className="text-blue-700 font-bold text-lg mt-2">
                                    ${currentPrice} per person
                                    {showDurationSelection && (
                                        <span className="text-sm font-normal text-gray-600 ml-2">
                                            ({formData.duration === 'halfDay' ? 'Half Day' : 'Full Day'})
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Booking Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                        {/* Duration Selection (only show if activity has half/full day pricing) */}
                        {showDurationSelection && (
                            <div className="mb-6">
                                <label className="block text-gray-700 font-medium mb-2">Select Duration *</label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                                            formData.duration === 'halfDay'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                                        }`}
                                        onClick={() => handleDurationChange('halfDay')}
                                    >
                                        Half Day
                                        <div className="text-xs mt-1 opacity-75">
                                            ${activity.halfDayPrice || activity.price}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
                                            formData.duration === 'fullDay'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                                        }`}
                                        onClick={() => handleDurationChange('fullDay')}
                                    >
                                        Full Day
                                        <div className="text-xs mt-1 opacity-75">
                                            ${activity.fullDayPrice || activity.price}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Date Selection */}
                            <div>
                                <label htmlFor="date" className="block text-gray-700 font-medium mb-2">Date *</label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            
                            {/* Number of Guests */}
                            <div>
                                <label htmlFor="guests" className="block text-gray-700 font-medium mb-2">Number of Guests *</label>
                                <select
                                    id="guests"
                                    name="guests"
                                    value={formData.guests}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    placeholder="Enter your full name"
                                />
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                    Email Address *
                                    {currentUser && (
                                        <span className="text-xs text-gray-500 ml-2">(Using your account email)</span>
                                    )}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        currentUser ? 'bg-gray-50 cursor-not-allowed' : ''
                                    }`}
                                    required
                                    placeholder={currentUser ? currentUser.email : "Enter your email address"}
                                    readOnly={!!currentUser}
                                    title={currentUser ? "Email is set to your account email" : ""}
                                />
                            </div>
                            
                            {/* Phone Number with Country Code */}
                            <div>
                                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                                <div className="flex space-x-2">
                                    {/* Country Code Selector */}
                                    <div className="w-1/3">
                                        <select
                                            id="countryCode"
                                            value={selectedCountryCode}
                                            onChange={handleCountryCodeChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {countryCodes.map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    {country.code} ({country.country})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Phone Number Input */}
                                    <div className="w-2/3">
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formatPhoneNumber(formData.phone)}
                                            onChange={handlePhoneChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="(123) 456-7890"
                                        />
                                        <div className="mt-1 text-sm text-gray-500">
                                            {formData.phone.length >= 5 ? (
                                                <span className="text-green-600">
                                                    ✓ Valid phone number ({formData.phone.length} digits)
                                                </span>
                                            ) : (
                                                <span>
                                                   (minimum 5 digits)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Special Requests */}
                            <div className="md:col-span-2">
                                <label htmlFor="specialRequests" className="block text-gray-700 font-medium mb-2">Special Requests (Optional)</label>
                                <textarea
                                    id="specialRequests"
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                    placeholder="Any specific dietary requirements, accessibility needs, or other requests..."
                                ></textarea>
                            </div>
                        </div>
                        
                        {/* Price Calculation */}
                        <div className="border-t border-b border-gray-200 py-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-700">
                                    ${currentPrice} × {formData.guests} guests
                                    {showDurationSelection && (
                                        <span className="text-xs text-gray-500 ml-1">
                                            ({formData.duration === 'halfDay' ? 'Half Day' : 'Full Day'})
                                        </span>
                                    )}
                                </span>
                                <span className="font-medium">${currentPrice * formData.guests}</span>
                            </div>
                            <div className="flex justify-between text-blue-800 font-bold">
                                <span>Total</span>
                                <span>${currentPrice * formData.guests}</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => navigate(`/activities/${id}`)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={submitting}
                            >
                                Back to Activity
                            </button>
                            
                            <button
                                type="submit"
                                className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg ${
                                    submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                                } transition-colors`}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : 'Send Booking Request'}
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>
            
            {/* Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                bookingReference={bookingReference}
                activityTitle={activity.title}
                date={formData.date}
                guests={formData.guests}
                duration={formData.duration === 'halfDay' ? 'Half Day' : 'Full Day'}
                totalPrice={currentPrice * formData.guests}
                bookingId={bookingId}
            />
        </div>
    );
};

export default BookingRequest;