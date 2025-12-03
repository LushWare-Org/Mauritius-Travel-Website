import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminContacts = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, today: 0, recent: 0 });
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Use Vite environment variable
  const API_URL = import.meta.env.VITE_API_URL || 'https://maldives-activity-booking-backend.onrender.com/api/v1';

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [filterStatus, searchTerm, currentPage]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/contact?page=${currentPage}&limit=10`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        setInquiries(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
      alert('Failed to load inquiries. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/contact/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.data || {});
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/contact/${inquiryId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchInquiries();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleReply = async () => {
    if (!selectedInquiry) return;
    
    if (!replyMessage.trim() || replyMessage.trim().length < 10) {
      alert('Please enter a reply message (minimum 10 characters)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/contact/${selectedInquiry._id}/reply`, 
        { replyMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setReplyMessage('');
      setSelectedInquiry(null);
      fetchInquiries();
      fetchStats();
      
      alert('Reply saved successfully!');
      
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save reply');
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/contact/${inquiryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInquiries();
      fetchStats();
      alert('Inquiry deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete inquiry');
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const getStatusStyle = (status) => {
    const colors = {
      new: '#f44336',    // Red
      read: '#2196f3',   // Blue
      replied: '#4caf50', // Green
      archived: '#9e9e9e' // Gray
    };
    return {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-block',
      backgroundColor: colors[status] || '#666',
      color: 'white'
    };
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Contact Inquiries</h1>
      
      {/* Stats */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#1e90ff' },
          { label: 'Unread', value: stats.unread, color: '#e74c3c' },
          { label: 'Today', value: stats.today, color: '#2ecc71' },
          { label: 'Recent', value: stats.recent, color: '#9b59b6' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>
              {stat.value || 0}
            </div>
            <div style={{ color: '#666', marginTop: '5px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {['all', 'new', 'read', 'replied', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: filterStatus === status ? '#007bff' : 'white',
                color: filterStatus === status ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            flex: 1,
            maxWidth: '300px'
          }}
        />
      </div>

      {/* Inquiries Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {inquiries.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Subject</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(inquiry => (
                <tr key={inquiry._id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: '12px' }}>{inquiry.name}</td>
                  <td style={{ padding: '12px' }}>{inquiry.email}</td>
                  <td style={{ padding: '12px' }}>{inquiry.subject}</td>
                  <td style={{ padding: '12px' }}>{formatDate(inquiry.createdAt)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={getStatusStyle(inquiry.status)}>
                      {inquiry.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => setSelectedInquiry(inquiry)}
                        style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(inquiry._id, inquiry.status === 'new' ? 'read' : 'new')}
                        style={{ padding: '5px 10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {inquiry.status === 'new' ? 'Read' : 'Unread'}
                      </button>
                      <button 
                        onClick={() => handleDelete(inquiry._id)}
                        style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No inquiries found
          </div>
        )}
      </div>

      {/* Pagination */}
      {inquiries.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            style={{ padding: '8px 16px', border: '1px solid #ddd', background: currentPage === 1 ? '#f8f9fa' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            style={{ padding: '8px 16px', border: '1px solid #ddd', background: currentPage === totalPages ? '#f8f9fa' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal for viewing/replying */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedInquiry(null)}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Inquiry Details</h2>
              <button onClick={() => setSelectedInquiry(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>Name:</strong> {selectedInquiry.name}<br />
              <strong>Email:</strong> {selectedInquiry.email}<br />
              <strong>Subject:</strong> {selectedInquiry.subject}<br />
              <strong>Date:</strong> {formatDateTime(selectedInquiry.createdAt)}<br />
              <strong>Message:</strong><br />
              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px', marginTop: '10px' }}>
                {selectedInquiry.message}
              </div>
            </div>

            {selectedInquiry.replyMessage && (
              <div style={{ marginBottom: '20px', padding: '10px', background: '#d4edda', borderRadius: '4px' }}>
                <strong>Previous Reply:</strong><br />
                {selectedInquiry.replyMessage}
              </div>
            )}

            <div>
              <strong>Reply:</strong>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                style={{ width: '100%', padding: '10px', marginTop: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
              />
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={handleReply} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Save Reply
                </button>
                <button onClick={() => { setSelectedInquiry(null); setReplyMessage(''); }} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;