import React from 'react';
import { Link } from 'react-router-dom';

const InfoPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Help & Information Center
          </h1>
          <p className="text-gray-600 text-lg">
            Everything you need to know about booking and managing your travel
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-4">
            <a href="#getting-started" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
              Getting Started
            </a>
            <a href="#faqs" className="bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition">
              FAQs
            </a>
            <Link to="/contact" className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition">
              Contact Support
            </Link>
            <Link to="/dashboard/bookings" className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-100 transition">
              My Bookings
            </Link>
          </div>
        </div>

        {/* Getting Started Section */}
        <div id="getting-started" className="mb-12 bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <i className="fas fa-rocket text-blue-600 text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
          </div>

          {/* What is this website for? */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <i className="fas fa-question-circle text-blue-500 mr-2"></i>
              What is this website for?
            </h3>
            <div className="bg-blue-50 rounded-lg p-5">
              <p className="text-gray-700">
                This website allows you to browse, book, and manage hotel stays, 
                activities, and airport transfers easily. We provide a seamless 
                experience for all your travel needs in one place.
              </p>
            </div>
          </div>

          {/* How do I make a booking? */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-calendar-check text-green-500 mr-2"></i>
              How do I make a booking?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Steps */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Booking Steps:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">1</span>
                    <span className="text-gray-700">Select your dates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">2</span>
                    <span className="text-gray-700">Choose a room or activity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">3</span>
                    <span className="text-gray-700">Add any extras (like airport transfer)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">4</span>
                    <span className="text-gray-700">Enter your details</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0">5</span>
                    <span className="text-gray-700">Make the payment</span>
                  </li>
                </ul>
              </div>

              {/* Confirmation Info */}
              <div className="bg-green-50 rounded-lg p-5">
                <div className="flex items-start mb-3">
                  <i className="fas fa-envelope text-green-600 text-lg mr-3 mt-1"></i>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Instant Confirmation</h4>
                    <p className="text-gray-700 text-sm">
                      You will receive a confirmation email instantly after completing your booking.
                      Check your inbox (and spam folder) for booking details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <Link
                to="/activities"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                Start Booking Now
              </Link>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div id="faqs" className="mb-12 bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <i className="fas fa-question-circle text-green-600 text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions (FAQs)</h2>
          </div>

          {/* FAQ Items */}
          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="border border-gray-200 rounded-lg hover:border-blue-300 transition">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <i className="fas fa-shuttle-van text-blue-500 mr-2"></i>
                      Do you offer airport transfers?
                    </h3>
                    <p className="text-gray-700">
                      Yes, you can add airport transfer services during the booking process. 
                      Simply select the "Add Airport Transfer" option when making your reservation.
                    </p>
                  </div>
                  <div className="ml-4 bg-blue-50 p-2 rounded-lg">
                    <i className="fas fa-check-circle text-blue-600"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 2 */}
            <div className="border border-gray-200 rounded-lg hover:border-green-300 transition">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <i className="fas fa-times-circle text-red-500 mr-2"></i>
                      Can I cancel my booking?
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Yes, depending on the plan you choose. Flexible bookings allow free 
                      cancellation before the deadline specified in your booking confirmation.
                    </p>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Cancellation Policies:</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li className="flex items-center">
                          <i className="fas fa-check text-green-500 mr-2"></i>
                          <span>Flexible Plan: Free cancellation up to 48 hours before check-in</span>
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check text-green-500 mr-2"></i>
                          <span>Standard Plan: 50% refund up to 72 hours before check-in</span>
                        </li>
                        <li className="flex items-center">
                          <i className="fas fa-check text-green-500 mr-2"></i>
                          <span>Non-refundable Plan: No cancellation allowed</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="ml-4 bg-green-50 p-2 rounded-lg">
                    <i className="fas fa-info-circle text-green-600"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ 3 */}
            <div className="border border-gray-200 rounded-lg hover:border-purple-300 transition">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <i className="fas fa-user-edit text-purple-500 mr-2"></i>
                      How do I update my personal details?
                    </h3>
                    <div className="space-y-3">
                      <p className="text-gray-700">
                        You can update your personal information at any time from your profile:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <span className="bg-purple-100 text-purple-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3">1</span>
                          <span className="text-gray-700">Go to your Profile</span>
                        </div>
                        <div className="flex items-center mb-3">
                          <span className="bg-purple-100 text-purple-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3">2</span>
                          <span className="text-gray-700">Click "Edit Account Information"</span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-purple-100 text-purple-800 text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center mr-3">3</span>
                          <span className="text-gray-700">Save your changes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 bg-purple-50 p-2 rounded-lg">
                    <i className="fas fa-user-cog text-purple-600"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Help Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-6 md:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <i className="fas fa-headset mr-2"></i>
                Contact Support
              </Link>
              <a
                href="tel:+1234567890"
                className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
              >
                <i className="fas fa-phone mr-2"></i>
                Call Now: +1 (234) 567-890
              </a>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              <i className="fas fa-clock mr-1"></i>
              Average response time: 15 minutes
            </p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-700 hover:text-blue-600 transition"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;