import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const BookingConfirmation = () => {
  const location = useLocation();
  const { 
    bookingReference, 
    tourPackage, 
    selectedActivities = [], 
    date, 
    guests, 
    totalPrice,
    success = true
  } = location.state || {};

  if (!success) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Your tour package booking has been successfully submitted. We'll send you a confirmation email shortly.
        </p>

        <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Reference Number:</span>
              <span className="font-medium">{bookingReference || 'Pending...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tour Package:</span>
              <span className="font-medium">{tourPackage?.title || 'Tour Package'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {date ? new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guests:</span>
              <span className="font-medium">{guests || 'N/A'}</span>
            </div>
            {selectedActivities.length > 0 && (
              <div>
                <span className="text-gray-600">Selected Activities:</span>
                <ul className="mt-2 space-y-1">
                  {selectedActivities.map((activity, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {activity.title} (RS {activity.price})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-gray-300">
              <span className="text-gray-600 font-medium">Total Amount:</span>
              <span className="text-xl font-bold text-blue-600">RS {totalPrice || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard/tour-package-bookings"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Bookings
          </Link>
          <Link
            to="/tour-packages"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Browse More Tours
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;