// pages/TourPackageDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TourImageGallery from '../components/tour-detail/TourPackageImageGallery';
import TourInfo from '../components/tour-detail/TourPackageInfo';
import TourTabs from '../components/tour-detail/TourPackageTabs';
import BookingForm from '../components/tour-detail/TourPackageBookingForm';
import { FaStar, FaCalendarAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import { tourPackagesAPI } from '../utils/api';

const TourPackageDetail = () => {
    const { id } = useParams();
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedTours, setRelatedTours] = useState([]);

    // Helper function to get display price based on currency type
    const getDisplayPrice = (tour) => {
        if (!tour) return { display: '', rs: 0, euro: 0 };
        
        switch(tour.currencyType) {
            case 'both':
                return {
                    rs: tour.priceRs,
                    euro: tour.priceEuro,
                    display: `Rs ${tour.priceRs} / € ${tour.priceEuro}`,
                    primary: `Rs ${tour.priceRs}`,
                    secondary: `€ ${tour.priceEuro}`
                };
            case 'rs-only':
                return {
                    rs: tour.priceRs,
                    euro: null,
                    display: `Rs ${tour.priceRs}`,
                    primary: `Rs ${tour.priceRs}`,
                    secondary: null
                };
            case 'euro-only':
                return {
                    rs: null,
                    euro: tour.priceEuro,
                    display: `€ ${tour.priceEuro}`,
                    primary: `€ ${tour.priceEuro}`,
                    secondary: null
                };
            default:
                return {
                    rs: tour.price,
                    euro: null,
                    display: `Rs ${tour.price}`,
                    primary: `Rs ${tour.price}`,
                    secondary: null
                };
        }
    };

    useEffect(() => {
        const fetchTour = async () => {
            setLoading(true);
            try {
                // Fetch the tour package by ID
                const tourResponse = await tourPackagesAPI.getById(id);
                const foundTour = tourResponse?.data?.data;

                if (foundTour) {
                    setTour(foundTour);

                    // Fetch all tours to determine related packages
                    const allToursResponse = await tourPackagesAPI.getAll();
                    const allTours = allToursResponse?.data?.data || [];

                    const related = allTours
                        .filter(t => t._id !== foundTour._id &&
                                     (t.type === foundTour.type || t.location === foundTour.location))
                        .slice(0, 4); // Limit to 4 related tours

                    setRelatedTours(related);
                }
            } catch (error) {
                console.error('Error fetching tour details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTour();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="text-xl font-bold mb-2">Tour Not Found</h2>
                    <p>Sorry, we couldn't find the tour package you're looking for.</p>
                </div>
            </div>
        );
    }

    const priceDisplay = getDisplayPrice(tour);

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero Image Gallery */}
            <TourImageGallery pkg={tour} />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Tour Header with Rating */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between">
                        <div className="lg:w-2/3">
                            <div className="flex flex-col md:flex-row md:items-start justify-between">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">{tour.title}</h1>
                                    <p className="text-gray-600 text-lg mb-6 max-w-3xl">{tour.shortDescription}</p>
                                    
                                    {/* Rating Display */}
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100">
                                            <div className="flex">
                                                {[...Array(5)].map((_, index) => (
                                                    <FaStar
                                                        key={index}
                                                        size={18}
                                                        className={index < Math.floor(tour.averageRating) ? "text-yellow-500" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="ml-2 font-bold text-lg">{tour.averageRating.toFixed(1)}</span>
                                            <span className="ml-2 text-gray-600">({tour.totalRatings} reviews)</span>
                                        </div>
                                        
                                        {/* Quick Stats */}
                                        <div className="flex flex-wrap gap-4">
                                            {tour.duration && (
                                                <div className="flex items-center text-gray-700">
                                                    <FaCalendarAlt className="text-blue-500 mr-2" />
                                                    <span className="font-medium">{tour.duration}</span>
                                                </div>
                                            )}
                                            {tour.maxParticipants && (
                                                <div className="flex items-center text-gray-700">
                                                    <FaUsers className="text-green-500 mr-2" />
                                                    <span className="font-medium">Up to {tour.maxParticipants} guests</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tour Highlights */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tour.highlights?.slice(0, 4).map((highlight, index) => (
                                    <div key={index} className="flex items-center text-gray-700">
                                        <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
                                        <span>{highlight}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Price Box */}
                        <div className="lg:w-1/3 mt-6 lg:mt-0 lg:pl-8">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
                                <div className="text-sm font-medium mb-2 opacity-90">Starting from</div>
                                
                                {/* Primary Price Display */}
                                <div className="text-4xl font-bold mb-1">
                                    {priceDisplay.primary}
                                </div>
                                
                                {/* Secondary Price Display (if both currencies) */}
                                {priceDisplay.secondary && (
                                    <div className="text-xl font-semibold mb-2 opacity-90">
                                        {priceDisplay.secondary}
                                    </div>
                                )}
                                
                                <div className="text-sm opacity-90 mb-4">per package</div>
                                
                                {/* Currency Type Badge */}
                                <div className="mb-4">
                                    <span className={`text-xs px-3 py-1 rounded-full ${
                                        tour.currencyType === 'both' 
                                            ? 'bg-green-500/20 text-green-300' 
                                            : tour.currencyType === 'rs-only'
                                            ? 'bg-blue-500/20 text-blue-300'
                                            : 'bg-yellow-500/20 text-yellow-300'
                                    }`}>
                                        {tour.currencyType === 'both' 
                                            ? 'Rs & Euro Available' 
                                            : tour.currencyType === 'rs-only'
                                            ? 'Rs Only'
                                            : 'Euro Only'}
                                    </span>
                                </div>
                                
                                <div className="text-xs opacity-75">
                                    <div className="flex items-center">
                                        <FaCheckCircle className="mr-2" size={12} />
                                          Contact us
                                    </div>
                                    <div className="flex items-center mt-1">
                                        <FaCheckCircle className="mr-2" size={12} />
                                        Reserve now & pay later
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Full width layout */}
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Left Column - Details Tabs */}
                    <div className="xl:w-6/12">
                        {/* Details Tabs */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                            <TourTabs pkg={tour} />
                        </div>
                    </div>

                    {/* Right Column - Booking Form (Wider) */}
                    <div className="xl:w-6/12">
                        {/* Booking Form - Now takes full width of the right column */}
                        <div>
                            <BookingForm tour={tour} />
                        </div>
                    </div>
                </div>

                {/* Related Tours */}
                {relatedTours.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">You might also like</h2>
                        <p className="text-gray-600 mb-8">Similar tours you might enjoy</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedTours.map((relatedTour) => {
                                const relatedPriceDisplay = getDisplayPrice(relatedTour);
                                return (
                                    <div key={relatedTour._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                                        <div className="relative">
                                            <img 
                                                src={relatedTour.image} 
                                                alt={relatedTour.title}
                                                className="w-full h-56 object-cover"
                                            />
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                                <span className="text-sm font-bold text-green-600">
                                                    {relatedPriceDisplay.display}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 h-14">{relatedTour.title}</h3>
                                            <div className="flex items-center mb-3">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, index) => (
                                                        <FaStar
                                                            key={index}
                                                            size={14}
                                                            className={index < Math.floor(relatedTour.averageRating) ? "text-yellow-500" : "text-gray-300"}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600">
                                                    {relatedTour.averageRating.toFixed(1)} ({relatedTour.totalRatings})
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-gray-600 text-sm">{relatedTour.duration || '1 day'}</span>
                                                <button className="text-blue-600 font-semibold text-sm hover:text-blue-800 flex items-center">
                                                    View Details
                                                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TourPackageDetail;