// pages/TourPackageDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TourImageGallery from '../components/tour-detail/TourPackageImageGallery';
import TourInfo from '../components/tour-detail/TourPackageInfo';
import TourTabs from '../components/tour-detail/TourPackageTabs';
import BookingForm from '../components/tour-detail/TourPackageBookingForm';
import { FaStar } from 'react-icons/fa';
import { tourPackagesAPI } from '../utils/api';

const TourPackageDetail = () => {
    const { id } = useParams();
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedTours, setRelatedTours] = useState([]);

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

    return (
        <div className="bg-gray-50">
            {/* Hero Image Gallery */}
            <TourImageGallery pkg={tour} />

            <div className="container mx-auto px-4 py-8">
                {/* Tour Header with Rating */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{tour.title}</h1>
                            <p className="text-gray-600 text-lg mb-4">{tour.shortDescription}</p>
                            
                            {/* Rating Display */}
                            <div className="flex items-center mb-4">
                                <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                                    <div className="flex">
                                        {[...Array(5)].map((_, index) => (
                                            <FaStar
                                                key={index}
                                                size={16}
                                                className={index < Math.floor(tour.averageRating) ? "text-yellow-500" : "text-gray-300"}
                                            />
                                        ))}
                                    </div>
                                    <span className="ml-2 font-bold">{tour.averageRating.toFixed(1)}</span>
                                    <span className="ml-1">({tour.totalRatings} reviews)</span>
                                </div>
                                <span className="ml-4 text-2xl font-bold text-green-600">
                                    Rs {tour.price}
                                </span>
                            </div>
                        </div>
                        
                        {/* Quick Stats */}
                        {/*<div className="flex space-x-6 mt-4 md:mt-0">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-800">
                                    {tour.duration || '5-7'}
                                </div>
                                <div className="text-sm text-gray-600">Days</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-800">
                                    {tour.difficulty || 'Moderate'}
                                </div>
                                <div className="text-sm text-gray-600">Difficulty</div>
                            </div>
                        </div>*/}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Details Tabs (Now includes Reviews) */}
                    <div className="lg:col-span-2">
                        <TourTabs pkg={tour} />
                    </div>

                    {/* Right Column - Booking Form */}
                    <div>
                        <BookingForm tour={tour} />
                        
                        {/* Additional Info Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h3 className="text-lg font-semibold mb-4">Tour Highlights</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>Customer Rating: {tour.averageRating.toFixed(1)}/5</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>Based on {tour.totalRatings} verified reviews</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>Instant booking confirmation</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>Best price guarantee</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Related Tours - Optional with ratings */}
                {relatedTours.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold mb-6">Related Tours</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedTours.map((relatedTour) => (
                                <div key={relatedTour._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <img 
                                        src={relatedTour.image} 
                                        alt={relatedTour.title}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 mb-2 truncate">{relatedTour.title}</h3>
                                        <div className="flex items-center mb-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, index) => (
                                                    <FaStar
                                                        key={index}
                                                        size={12}
                                                        className={index < Math.floor(relatedTour.averageRating) ? "text-yellow-500" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="ml-2 text-sm text-gray-600">
                                                {relatedTour.averageRating.toFixed(1)} ({relatedTour.totalRatings})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-green-600">Rs {relatedTour.price}</span>
                                            <button className="text-blue-600 text-sm font-semibold hover:text-blue-800">
                                                View Details →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TourPackageDetail;