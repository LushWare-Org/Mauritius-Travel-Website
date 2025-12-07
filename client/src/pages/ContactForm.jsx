import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const countryCodes = [
  { code: '+230', name: 'Mauritius', flag: '🇲🇺' },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
];

const ContactForm = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    countryCode: '+230',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (currentUser && name === 'email') return;

    if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryCodeChange = (e) => {
    setFormData((prev) => ({ ...prev, countryCode: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

      const contactData = {
        ...formData,
        phone: formData.phone
          ? `${formData.countryCode} ${formData.phone}`
          : '',
      };

      await axios.post(`${API_URL}/contact`, contactData);

      setSuccess(true);
      setFormData({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        countryCode: '+230',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return '';

    if (formData.countryCode === '+230') {
      if (value.length <= 4) return value;
      if (value.length <= 7) return `${value.slice(0, 4)} ${value.slice(4)}`;
      return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7, 9)}`;
    } else if (formData.countryCode === '+1') {
      const cleaned = value.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (!match) return value;
      return `${match[1]}${match[2] ? ` ${match[2]}` : ''}${
        match[3] ? `-${match[3]}` : ''
      }`;
    }

    return value;
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-8 text-white mb-8 overflow-hidden shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 ring-4 ring-white/20">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            Get in Touch
          </h1>
          <p className="text-blue-100 text-lg max-w-md mx-auto">
            We're here to help! Reach out for any questions about your aquatic
            adventures.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 -mt-6 relative z-20 border border-gray-100">
        {/* Success Message */}
        {success && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Message Sent Successfully!
                  </h3>
                  <p className="mt-1 text-gray-600">
                    Thank you for contacting us. We'll get back to you within 24
                    hours.
                  </p>
                  <div className="mt-4 flex items-center text-sm text-emerald-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Response time: 24 hours
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 animate-shake">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Oops! Something went wrong
                  </h3>
                  <p className="mt-1 text-gray-600">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name & Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white group-hover:shadow-sm"
                  placeholder="John Doe"
                />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl pointer-events-none transition-all duration-300"></div>
              </div>
            </div>

            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={!!currentUser}
                  className={`w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white group-hover:shadow-sm ${
                    currentUser ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'
                  }`}
                  placeholder="john@example.com"
                />
                {currentUser && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Auto-filled
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl pointer-events-none transition-all duration-300"></div>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Phone Number (Optional)
            </label>
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-[160px] group/country">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer group-hover/country:bg-white"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 border-2 border-transparent group-hover/country:border-blue-200 rounded-xl pointer-events-none transition-all duration-300"></div>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="phone"
                  value={formatPhoneNumber(formData.phone)}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white"
                  placeholder={
                    formData.countryCode === '+230'
                      ? '5XXX XXXX'
                      : 'Your phone number'
                  }
                  maxLength={formData.countryCode === '+230' ? 9 : 15}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formData.countryCode === '+230'
                ? 'Enter 8-digit  number'
                : 'We may contact you for booking confirmations'}
            </p>
          </div>

          {/* Subject */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Subject
            </label>
            <div className="relative">
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white group-hover:shadow-sm"
                placeholder="What would you like to discuss?"
              />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl pointer-events-none transition-all duration-300"></div>
            </div>
          </div>

          {/* Message */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Your Message
            </label>
            <div className="relative">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:bg-white group-hover:shadow-sm resize-none"
                placeholder="Tell us about your inquiry or special requests..."
              />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl pointer-events-none transition-all duration-300"></div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-sm text-gray-500">
                Please provide as much detail as possible
              </p>
              <p
                className={`text-sm ${
                  formData.message.length > 500
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}
              >
                {formData.message.length}/500
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-5 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center justify-center">
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending Your Message...
                </>
              ) : (
                <>
                  Send Message
                  <svg
                    className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </div>
          </button>
        </form>

        {/* Contact Info Footer */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Email Us</h4>
              <a
                href="mailto:support@aquaexcursions.com"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                our mail
              </a>
            </div>

            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-3">
                <svg
                  className="w-6 h-6 text-cyan-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Call Us</h4>
              <a
                href="tel:+23012345678"
                className="text-cyan-600 hover:text-cyan-800 transition-colors"
              >
                our phone number
              </a>
            </div>

            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Response Time
              </h4>
              <p className="text-indigo-600">Within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
