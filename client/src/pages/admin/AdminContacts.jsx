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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Use Vite environment variable
  const API_URL = import.meta.env.VITE_API_URL;

  // Detect mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      new: '#f44336',
      read: '#2196f3',
      replied: '#4caf50',
      archived: '#9e9e9e'
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
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px', fontSize: '24px' }}></i>
          <div style={{ marginTop: '10px' }}>Loading inquiries...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Contact Inquiries</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ☰
          </button>
        </div>
      )}

      {/* Mobile Filter Menu */}
      {isMobile && isMobileMenuOpen && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {['all', 'new', 'read', 'replied', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => { 
                  setFilterStatus(status); 
                  setCurrentPage(1);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: filterStatus === status ? '#007bff' : '#f0f0f0',
                  color: filterStatus === status ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  flex: '1 0 auto'
                }}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <>
          <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Contact Inquiries</h1>

          {/* Desktop Filters */}
          <div style={{ 
            marginBottom: '20px',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'new', 'read', 'replied', 'archived'].map(status => (
                <button
                  key={status}
                  onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: filterStatus === status ? '#007bff' : 'white',
                    color: filterStatus === status ? 'white' : '#333',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    fontWeight: '500'
                  }}
                  onMouseOver={e => {
                    if (filterStatus !== status) e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseOut={e => {
                    if (filterStatus !== status) e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Inquiries List */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '10px', 
        overflow: 'hidden', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        {inquiries.length > 0 ? (
          <>
            {isMobile ? (
              // Mobile List View
              <div>
                {inquiries.map(inquiry => (
                  <div key={inquiry._id} style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: inquiry.status === 'new' ? '#fff8e1' : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                          {inquiry.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                          {inquiry.email}
                        </div>
                      </div>
                      <span style={getStatusStyle(inquiry.status)}>
                        {inquiry.status}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', color: '#333' }}>
                        {inquiry.subject}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                        {formatDateTime(inquiry.createdAt)}
                      </div>
                    </div>
                    
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#666',
                      lineHeight: '1.4',
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '10px'
                    }}>
                      {inquiry.message}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                      <button 
                        onClick={() => setSelectedInquiry(inquiry)}
                        style={{ 
                          flex: 1,
                          padding: '8px',
                          background: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        View & Reply
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(inquiry._id, inquiry.status === 'new' ? 'read' : 'new')}
                        style={{ 
                          padding: '8px 12px',
                          background: '#6c757d', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {inquiry.status === 'new' ? '✓ Read' : '↻ Unread'}
                      </button>
                      <button 
                        onClick={() => handleDelete(inquiry._id)}
                        style={{ 
                          padding: '8px 12px',
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Subject</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map(inquiry => (
                    <tr key={inquiry._id} style={{ 
                      borderBottom: '1px solid #f1f1f1',
                      backgroundColor: inquiry.status === 'new' ? '#fff8e1' : 'white',
                      transition: 'background-color 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                       onMouseOut={e => e.currentTarget.style.backgroundColor = inquiry.status === 'new' ? '#fff8e1' : 'white'}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{inquiry.name}</td>
                      <td style={{ padding: '15px' }}>{inquiry.email}</td>
                      <td style={{ padding: '15px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inquiry.subject}
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>{formatDate(inquiry.createdAt)}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={getStatusStyle(inquiry.status)}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => setSelectedInquiry(inquiry)}
                            style={{ 
                              padding: '8px 15px', 
                              background: '#007bff', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#0056b3'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#007bff'}
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(inquiry._id, inquiry.status === 'new' ? 'read' : 'new')}
                            style={{ 
                              padding: '8px 15px', 
                              background: '#6c757d', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#545b62'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#6c757d'}
                          >
                            {inquiry.status === 'new' ? 'Mark Read' : 'Mark Unread'}
                          </button>
                          <button 
                            onClick={() => handleDelete(inquiry._id)}
                            style={{ 
                              padding: '8px 15px', 
                              background: '#dc3545', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#c82333'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#dc3545'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>No inquiries found</h3>
            <p style={{ fontSize: '14px', color: '#999' }}>
              {filterStatus !== 'all' ? `No ${filterStatus} inquiries` : 'Try changing your search or filter'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {inquiries.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            style={{ 
              padding: '10px 20px', 
              border: '1px solid #ddd', 
              background: currentPage === 1 ? '#f8f9fa' : 'white', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: isMobile ? '80px' : '100px'
            }}
          >
            ← Previous
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isMobile && (
              <>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: '8px 15px',
                        border: '1px solid #ddd',
                        background: currentPage === pageNum ? '#007bff' : 'white',
                        color: currentPage === pageNum ? 'white' : '#333',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: currentPage === pageNum ? '600' : '400'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span style={{ padding: '0 5px' }}>...</span>
                )}
                
                {totalPages > 5 && currentPage < totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    style={{
                      padding: '8px 15px',
                      border: '1px solid #ddd',
                      background: currentPage === totalPages ? '#007bff' : 'white',
                      color: currentPage === totalPages ? 'white' : '#333',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {totalPages}
                  </button>
                )}
              </>
            )}
            
            <span style={{ 
              fontSize: '14px', 
              color: '#666',
              padding: isMobile ? '10px' : '0'
            }}>
              Page {currentPage} of {totalPages}
            </span>
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            style={{ 
              padding: '10px 20px', 
              border: '1px solid #ddd', 
              background: currentPage === totalPages ? '#f8f9fa' : 'white', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: isMobile ? '80px' : '100px'
            }}
          >
            Next →
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
          zIndex: 1000,
          padding: isMobile ? '10px' : '20px'
        }} onClick={() => setSelectedInquiry(null)}>
          <div style={{
            backgroundColor: 'white',
            padding: isMobile ? '15px' : '25px',
            borderRadius: '12px',
            maxWidth: isMobile ? '100%' : '700px',
            width: '100%',
            maxHeight: isMobile ? '90vh' : '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: isMobile ? '20px' : '24px', margin: 0 }}>Inquiry Details</h2>
              <button 
                onClick={() => setSelectedInquiry(null)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: isMobile ? '24px' : '28px', 
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                gap: '15px',
                marginBottom: '15px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Name</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{selectedInquiry.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Email</div>
                  <div style={{ fontSize: '16px', color: '#007bff' }}>{selectedInquiry.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Date</div>
                  <div style={{ fontSize: '16px' }}>{formatDateTime(selectedInquiry.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Status</div>
                  <div>
                    <span style={getStatusStyle(selectedInquiry.status)}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Subject</div>
                <div style={{ fontSize: '18px', fontWeight: '500', color: '#333' }}>{selectedInquiry.subject}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>Message</div>
                <div style={{ 
                  padding: '15px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#333'
                }}>
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            {selectedInquiry.replyMessage && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                background: '#d4edda', 
                borderRadius: '8px',
                borderLeft: '4px solid #28a745'
              }}>
                <div style={{ fontSize: '12px', color: '#155724', marginBottom: '5px', fontWeight: '600' }}>
                  Previous Reply
                </div>
                <div style={{ fontSize: '14px', color: '#155724', lineHeight: '1.6' }}>
                  {selectedInquiry.replyMessage}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                Your Reply {!selectedInquiry.replyMessage && "(This will mark as replied)"}
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your detailed reply here..."
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  marginBottom: '15px', 
                  borderRadius: '8px', 
                  border: '1px solid #ddd', 
                  minHeight: '150px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
              
              <div style={{ 
                marginTop: '20px', 
                display: 'flex', 
                gap: '10px', 
                justifyContent: isMobile ? 'space-between' : 'flex-end',
                flexWrap: isMobile ? 'wrap' : 'nowrap'
              }}>
                <button 
                  onClick={() => { 
                    setSelectedInquiry(null); 
                    setReplyMessage(''); 
                  }} 
                  style={{ 
                    padding: '12px 20px', 
                    background: '#6c757d', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    flex: isMobile ? '1' : 'none'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReply} 
                  style={{ 
                    padding: '12px 25px', 
                    background: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    flex: isMobile ? '1' : 'none'
                  }}
                >
                  Save Reply & Send
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