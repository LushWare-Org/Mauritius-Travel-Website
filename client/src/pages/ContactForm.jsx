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
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (currentUser && name === 'email') return;
    
    // Prevent non-numeric input for phone number
    if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCountryCodeChange = (e) => {
    setFormData(prev => ({ ...prev, countryCode: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      
      // Combine country code and phone number for backend
      const contactData = {
        ...formData,
        phone: formData.phone ? `${formData.countryCode} ${formData.phone}` : ''
      };
      
      await axios.post(`${API_URL}/contact`, contactData);
      
      setSuccess(true);
      setFormData({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        countryCode: '+230',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    
    // Format based on country code for better UX
    if (formData.countryCode === '+230') {
      // Mauritius format: 5XXX XXXX or 5XX XX XX
      if (value.length <= 4) return value;
      if (value.length <= 7) return `${value.slice(0, 4)} ${value.slice(4)}`;
      return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7, 9)}`;
    } else if (formData.countryCode === '+1') {
      // US/Canada format: (XXX) XXX-XXXX
      const cleaned = value.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (!match) return value;
      return `${match[1]}${match[2] ? ` ${match[2]}` : ''}${match[3] ? `-${match[3]}` : ''}`;
    }
    
    return value; // Return plain number for other countries
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-t-xl p-8 text-white text-center mb-8">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
        <p className="opacity-90">We're here to help with any questions</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 -mt-4">
        {/* Status Messages */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
            <div className="flex items-center">
              <div className="text-green-500 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800">Message sent!</p>
                <p className="text-sm text-green-600">We'll reply within 24 hours.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.954-.833-2.724 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two Column Layout for Name/Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={!!currentUser}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-800 focus:ring-1 focus:ring-blue-800 ${
                  currentUser ? 'bg-gray-50' : ''
                }`}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Phone with Country Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
            <div className="flex space-x-3">
              <div className="relative flex-1 max-w-[140px]">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-800 focus:ring-1 focus:ring-blue-800 appearance-none"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="phone"
                  value={formatPhoneNumber(formData.phone)}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                  placeholder={formData.countryCode === '+230' ? '5XXX XXXX' : 'Phone number'}
                  maxLength={formData.countryCode === '+230' ? 9 : 15}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {formData.countryCode === '+230' 
                ? 'Enter 8-digit Mauritius number starting with 5' 
                : 'Enter your local phone number'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
              placeholder="What is this about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
              placeholder="How can we help you today?"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-800 to-blue-700 text-white py-4 rounded-lg font-medium hover:from-blue-900 hover:to-blue-800 transition-all disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              'Send Message'
            )}
          </button>
        </form>

        {/* Contact Info Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Prefer email? Contact us at{' '}
            <a href="mailto:support@mauritiusparadise.com" className="text-blue-800 font-medium hover:underline">
              support@mauritiusparadise.com
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Call us: <span className="text-blue-800 font-medium">+230 5XXX XXXX</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;