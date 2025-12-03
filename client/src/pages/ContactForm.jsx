import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ContactForm = ({ user }) => {
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  const { name, email, phone, subject, message } = formData;

  const onChange = (e) => {
    if (e.target.name === 'message') {
      setCharCount(e.target.value.length);
    }
    // If user is logged in, don't allow email change
    if (user && e.target.name === 'email') {
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Use the correct API URL - match your api.js
      const API_URL = import.meta.env.VITE_API_URL || 'https://maldives-activity-booking-backend.onrender.com/api/v1';
      
      const res = await axios.post(
        `${API_URL}/contact`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(true);
      setFormData({
        name: user ? user.name : '',
        email: user ? user.email : '',
        phone: '',
        subject: '',
        message: ''
      });
      setCharCount(0);
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Contact form error:', err);
      console.error('Error details:', err.response?.data);
      
      // Better error message
      if (err.response?.status === 404) {
        setError('Contact endpoint not found. Please check backend routes.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

const ContactPage = () => {
  const { currentUser } = useAuth();
  
  return <ContactForm user={currentUser} />;
};

  // Inline CSS
  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      fontFamily: "'Inter', sans-serif"
    },
    title: {
      textAlign: 'center',
      color: '#1e90ff',
      marginBottom: '1rem',
      fontSize: '2rem',
      fontWeight: '700',
      fontFamily: "'Montserrat', sans-serif"
    },
    subtitle: {
      textAlign: 'center',
      color: '#7f8c8d',
      marginBottom: '2.5rem',
      fontSize: '1rem',
      lineHeight: '1.6'
    },
    alert: {
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      borderRadius: '8px',
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    alertSuccess: {
      backgroundColor: '#e8f7ef',
      color: '#0f5132',
      border: '1px solid #badbcc'
    },
    alertError: {
      backgroundColor: '#fde8e8',
      color: '#842029',
      border: '1px solid #f5c2c7'
    },
    formGroup: {
      marginBottom: '1.75rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#2c3e50',
      fontWeight: '600',
      fontSize: '0.95rem'
    },
    required: {
      color: '#e74c3c'
    },
    input: {
      width: '100%',
      padding: '0.875rem 1rem',
      border: '2px solid #e1e8ed',
      borderRadius: '8px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease',
      fontFamily: "'Inter', sans-serif"
    },
    inputDisabled: {
      width: '100%',
      padding: '0.875rem 1rem',
      border: '2px solid #f1f1f1',
      borderRadius: '8px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      backgroundColor: '#f9f9f9',
      color: '#666',
      cursor: 'not-allowed',
      fontFamily: "'Inter', sans-serif"
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#1e90ff'
    },
    textarea: {
      width: '100%',
      padding: '0.875rem 1rem',
      border: '2px solid #e1e8ed',
      borderRadius: '8px',
      fontSize: '1rem',
      minHeight: '140px',
      resize: 'vertical',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease',
      fontFamily: "'Inter', sans-serif",
      lineHeight: '1.5'
    },
    charCount: {
      fontSize: '0.85rem',
      color: '#7f8c8d',
      textAlign: 'right',
      marginTop: '0.5rem'
    },
    charCountWarning: {
      color: '#e74c3c',
      fontWeight: 'bold'
    },
    button: {
      width: '100%',
      padding: '1rem',
      backgroundColor: '#1e90ff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.05rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: "'Montserrat', sans-serif",
      letterSpacing: '0.5px'
    },
    buttonHover: {
      backgroundColor: '#0066cc',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(30, 144, 255, 0.3)'
    },
    buttonDisabled: {
      backgroundColor: '#a0c4ff',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    },
    icon: {
      fontSize: '1.2rem'
    },
    note: {
      fontSize: '0.85rem',
      color: '#7f8c8d',
      marginTop: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  };

  const isFormValid = name && email && subject && message && charCount <= 1000 && charCount >= 10;

  return (
    <div style={styles.container} className="animate-fade-in">
      <h2 style={styles.title}>Get In Touch</h2>
      <p style={styles.subtitle}>
        Have questions about our activities or need assistance with your booking? 
        Fill out the form below and our team will respond within 24 hours.
      </p>
      
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          <i className="fas fa-check-circle" style={styles.icon}></i>
          <span>Thank you for contacting us! We will get back to you soon.</span>
        </div>
      )}
      
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          <i className="fas fa-exclamation-circle" style={styles.icon}></i>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Full Name <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            required
            style={styles.input}
            placeholder="Enter your full name"
            onFocus={(e) => e.target.style.borderColor = styles.inputFocus.borderColor}
            onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Email Address of this account <span style={styles.required}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
            disabled={!!user} // Disable if user is logged in
            style={user ? styles.inputDisabled : styles.input}
            placeholder="Enter your email address given to this account"
            onFocus={(e) => !user && (e.target.style.borderColor = styles.inputFocus.borderColor)}
            onBlur={(e) => !user && (e.target.style.borderColor = '#e1e8ed')}
          />
          {user && (
            <div style={styles.note}>
              <i className="fas fa-lock" style={{ fontSize: '0.8rem' }}></i>
              <span>Email is locked to your account email</span>
            </div>
          )}
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Phone Number <span style={{ color: '#7f8c8d', fontWeight: 'normal' }}>(Optional)</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={onChange}
            style={styles.input}
            placeholder="Enter your phone number"
            onFocus={(e) => e.target.style.borderColor = styles.inputFocus.borderColor}
            onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Subject <span style={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={subject}
            onChange={onChange}
            required
            style={styles.input}
            placeholder="What is this regarding?"
            onFocus={(e) => e.target.style.borderColor = styles.inputFocus.borderColor}
            onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Message <span style={styles.required}>*</span>
          </label>
          <textarea
            name="message"
            value={message}
            onChange={onChange}
            required
            minLength="10"
            maxLength="1000"
            style={styles.textarea}
            placeholder="Please provide details about your inquiry..."
            onFocus={(e) => e.target.style.borderColor = styles.inputFocus.borderColor}
            onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
          />
          <div style={styles.charCount}>
            <span style={charCount > 1000 || charCount < 10 ? styles.charCountWarning : {}}>
              {charCount}/1000 characters {charCount < 10 && '(minimum 10 characters)'}
            </span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !isFormValid}
          style={{
            ...styles.button,
            ...(loading || !isFormValid ? styles.buttonDisabled : {})
          }}
          onMouseEnter={(e) => {
            if (!loading && isFormValid) {
              Object.assign(e.target.style, styles.buttonHover);
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && isFormValid) {
              e.target.style.backgroundColor = styles.button.backgroundColor;
              e.target.style.transform = 'none';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
              Sending Message...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
              Send Message
            </>
          )}
        </button>
      </form>
      
      <div style={{
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #eee',
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '0.9rem'
      }}>
        <p>
          <i className="fas fa-clock" style={{ marginRight: '0.5rem' }}></i>
          Response Time: Within 24 hours
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <i className="fas fa-phone" style={{ marginRight: '0.5rem' }}></i>
          Emergency Contact: +960 123-4567
        </p>
      </div>
    </div>
  );
};

export default ContactForm;