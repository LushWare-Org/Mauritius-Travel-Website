import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  Mail,
  User,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

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
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (currentUser && name === 'email') return;

    if (name === 'phone') {
      setFormData((p) => ({ ...p, phone: value.replace(/\D/g, '') }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      await axios.post(`${API_URL}/contact`, {
        ...formData,
        phone: formData.phone
          ? `${formData.countryCode} ${formData.phone}`
          : '',
      });

      setSuccess(true);
      setFormData({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        countryCode: '+230',
        phone: '',
        subject: '',
        message: '',
      });
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 py-4">
      <div className="rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6 text-white">
          <h2 className="text-xl font-semibold tracking-wide">
            Contact Support
          </h2>
          <p className="text-sm opacity-90 mt-1">
            We usually reply within 24 hours
          </p>
        </div>

        <div className="p-6 space-y-5">

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Message sent successfully
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name & Email */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                icon={User}
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                icon={Mail}
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!!currentUser}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Phone (optional)
              </label>
              <div className="flex gap-2">
                <div className="relative w-28">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        countryCode: e.target.value,
                      }))
                    }
                    className="w-full h-10 rounded-xl border px-2 text-sm focus:ring-2 focus:ring-blue-700"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-10 pl-10 rounded-xl border text-sm focus:ring-2 focus:ring-blue-700"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            <Input
              icon={MessageSquare}
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Message
              </label>
              <textarea
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-700"
                placeholder="Tell us how we can help…"
              />
            </div>

            <button
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-800 to-blue-700 text-white font-medium flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-70"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending…' : 'Send Message'}
            </button>
          </form>

          <div className="pt-4 border-t text-center text-xs text-gray-600">
            <p>
              Email:{' '}
              <a
                href="mailto:Mervbn01@gmail.com"
                className="text-blue-800 font-medium hover:underline"
              >
                Mervbn01@gmail.com
              </a>
            </p>
            <p className="mt-1">
              Phone:{' '}
              <span className="text-blue-800 font-medium">
                +230 5813 7644
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Reusable Input Component */
const Input = ({ icon: Icon, label, ...props }) => (
  <div>
    <label className="text-xs font-medium text-gray-600 mb-1 block">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <input
        {...props}
        className="w-full h-10 pl-10 rounded-xl border text-sm focus:ring-2 focus:ring-blue-700"
      />
    </div>
  </div>
);

export default ContactForm;
