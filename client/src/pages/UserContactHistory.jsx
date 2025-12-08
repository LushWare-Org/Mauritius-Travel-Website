import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserContactHistory = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://maldives-activity-booking-backend.onrender.com/api/v1';

  useEffect(() => {
    fetchUserInquiries();
  }, []);

  const fetchUserInquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/user/contact`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        setInquiries(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch contact history:', err);
      setError('Failed to load your contact history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-green-100 text-green-800',
      replied: 'bg-yellow-100 text-yellow-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading your contact history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-500"></i>
          </div>
          <div className="ml-3">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Contact Inquiries</h1>
          <p className="text-gray-600 mt-1">View all your inquiries and admin responses</p>
        </div>
        <Link 
          to="/contact" 
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          New Inquiry
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-info-circle text-blue-500"></i>
          </div>
          <div className="ml-3">
            <p className="text-blue-700">
              Here you can view all your contact inquiries and any replies from our admin team.
            </p>
          </div>
        </div>
      </div>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-inbox text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries yet</h3>
          <p className="text-gray-600 mb-6">You haven't submitted any contact inquiries yet.</p>
          <Link 
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-envelope mr-2"></i>
            Contact Us
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div 
              key={inquiry._id} 
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedInquiry(inquiry)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{inquiry.subject}</h3>
                  <div className="text-sm text-gray-500">
                    Submitted on {formatDate(inquiry.createdAt)}
                  </div>
                </div>
                <div className="mt-2 sm:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(inquiry.status)}`}>
                    {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="text-gray-600 mb-3 line-clamp-2">
                {inquiry.message}
              </div>
              
              {inquiry.replyMessage && (
                <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <i className="fas fa-reply mr-1"></i>
                  Admin has replied
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInquiry(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
                <button 
                  onClick={() => setSelectedInquiry(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Subject */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <div className="text-lg text-gray-900 font-medium">{selectedInquiry.subject}</div>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted On</label>
                  <div className="text-gray-900">{formatDate(selectedInquiry.createdAt)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedInquiry.status)}`}>
                      {selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User's Message */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-gray-800 whitespace-pre-wrap">{selectedInquiry.message}</div>
                </div>
              </div>

              {/* Admin Reply */}
              {selectedInquiry.replyMessage ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Reply</label>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-user-shield text-white text-sm"></i>
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">Admin Response</div>
                          <div className="text-sm text-blue-700">
                            Replied on {formatDate(selectedInquiry.repliedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {selectedInquiry.replyMessage}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-clock text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reply yet</h3>
                  <p className="text-gray-600">Our team will respond to your inquiry soon.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserContactHistory;