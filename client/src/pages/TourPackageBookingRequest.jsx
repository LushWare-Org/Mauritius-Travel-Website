// src/pages/TourPackageBookingRequest.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tourPackagesAPI, tourPackageBookingsAPI, userBookingsAPI } from '../utils/api';
import ConfirmationModal from '../components/booking/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

const TourPackageBookingRequest = () => {
  const { id } = useParams(); // tour package id
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    guests: 2,
    fullName: '',
    email: '',
    phone: '',
    selectedActivities: [],
    specialRequests: ''
  });

  // Prefill from navigation state and user
  useEffect(() => {
    const updates = {};
    if (location.state?.selectedDate) {
      updates.date = location.state.selectedDate;
      updates.guests = location.state.guests || 2;
    }
    if (location.state?.selectedActivities) {
        updates.selectedActivities = location.state.selectedActivities;
    }
    if (currentUser) {
      if (currentUser.email && !formData.email) updates.email = currentUser.email;
      if (currentUser.name && !formData.fullName) updates.fullName = currentUser.name;
    }
    if (Object.keys(updates).length) setFormData(prev => ({ ...prev, ...updates }));
  }, [location.state, currentUser]);

  // Fetch tour package details
  useEffect(() => {
    const fetchTour = async () => {
      setLoading(true);
      try {
        const resp = await tourPackagesAPI.getById(id);
        const found = resp?.data?.data;
        if (found) setTour(found);
      } catch (err) {
        console.error('Error fetching tour:', err);
        setError('Failed to load tour details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTour();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const reference = `TPB-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingReference(reference);

    const guestsNum = parseInt(formData.guests, 10);

    // Validate required fields
    if (!formData.date) {
      setError('Please select a date.');
      setSubmitting(false);
      return;
    }
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    try {
      const bookingData = {
        tourPackageId: id, // ensure backend expects this field
        startDate: formData.date,
        guests: guestsNum,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        specialRequests: formData.specialRequests,
        bookingReference: reference,
        selectedActivities: formData.selectedActivities, 
        activitiesTotal: formData.selectedActivities.reduce((sum, activity) => sum + (activity.price || 0) * guestsNum, 0)
      };

      // Add activities display in the booking summary
    {formData.selectedActivities && formData.selectedActivities.length > 0 && (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Selected Activities:</h4>
        <ul className="space-y-2">
            {formData.selectedActivities.map(activity => (
                <li key={activity._id} className="flex justify-between text-sm">
                    <span>{activity.title}</span>
                    <span>Rs {activity.price} × {formData.guests} = Rs {activity.price * formData.guests}</span>
                </li>
            ))}
        </ul>
      </div>
    )}

      console.log('Booking payload:', bookingData);

      const response = await tourPackageBookingsAPI.create(bookingData);

      if (response?.data?.success) {
        setBookingId(response.data.data._id);

        // refresh user bookings
        try {
          await userBookingsAPI.getStats();
          await userBookingsAPI.getUpcoming();
          await userBookingsAPI.getHistory();
        } catch (refreshErr) {
          console.warn('Refresh failed:', refreshErr);
        }

        setIsModalOpen(true);
      } else {
        throw new Error(response?.data?.message || 'Unknown server error');
      }
    } catch (err) {
      console.error('Error creating tour booking:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to create booking. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/'); // or navigate to bookings page
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
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">Tour Not Found</h2>
          <p>Sorry, we couldn't find the tour you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600 mb-8">Review details and complete your booking request for this tour package.</p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 mb-4 md:mb-0">
                <img src={tour.image} alt={tour.title} className="w-full h-32 object-cover rounded" />
              </div>
              <div className="md:w-3/4 md:pl-6">
                <h2 className="text-xl font-bold text-blue-700">{tour.title}</h2>
                <div className="flex items-center mt-1 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2-..."></path>
                  </svg>
                  <span className="ml-1 text-sm text-gray-600">{tour.rating} ({tour.reviewCount} reviews)</span>
                </div>
                <div className="text-gray-700 mb-1"><span className="font-medium">Location:</span> {tour.location}</div>
                <div className="text-gray-700 mb-1"><span className="font-medium">Duration:</span> {tour.duration} days</div>
                <div className="text-blue-700 font-bold text-lg mt-2">Rs {tour.price} per person</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="date" className="block text-gray-700 font-medium mb-2">Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label htmlFor="guests" className="block text-gray-700 font-medium mb-2">Number of Guests *</label>
                <select
                  id="guests"
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Array.from({ length: tour.maxParticipants || 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="specialRequests" className="block text-gray-700 font-medium mb-2">Special Requests (Optional)</label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Any specific dietary requirements, accessibility needs, or other requests..."
              />
            </div>

            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Rs {tour.price} × {formData.guests} guests</span>
                <span className="font-medium">Rs {tour.price * formData.guests}</span>
              </div>
              <div className="flex justify-between text-blue-800 font-bold">
                <span>Total</span>
                <span>Rs {tour.price * formData.guests}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate(`/tour-packages/${id}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Back to Tour
              </button>

              <button
                type="submit"
                className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Send Booking Request'}
              </button>
            </div>

            {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        bookingReference={bookingReference}
        activityTitle={tour.title}
        date={formData.date}
        guests={formData.guests}
        totalPrice={(tour.price || 0) * formData.guests}
        bookingId={bookingId}
      />
    </div>
  );
};

export default TourPackageBookingRequest;
