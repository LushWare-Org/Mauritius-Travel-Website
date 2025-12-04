// utils/api.js
import axios from 'axios';

// Create axios instance with base URL - use environment variable or fallback to local development
const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (typeof envApiUrl === 'string' && !envApiUrl.startsWith('VITE_API_URL=')) 
  ? envApiUrl 
  : 'https://maldives-activity-booking-backend.onrender.com/api/v1';

// Debug: Log the API URL being used (only in development)
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
  console.log('Environment:', import.meta.env.MODE);
}

// Create axios instance with base URL
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable credentials for authentication
});

// Add request interceptor to include auth token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Keep only localStorage as in working version
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData uploads, remove the default Content-Type header
    // Let the browser set it automatically with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Debug request headers in production to help diagnose issues
    if (import.meta.env.PROD) {
      console.log('🔐 Request headers:', {
        auth: config.headers.Authorization ? 'Bearer token present' : 'No auth token',
        url: config.url,
        method: config.method,
        withCredentials: config.withCredentials
      });
    }
    
    // Always ensure withCredentials is true for cross-origin requests
    config.withCredentials = true;
    
    return config;
  },  (error) => Promise.reject(error)
);

// Add response interceptor for error handling - keep it simple like working version
API.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('✅ API Success:', response.config?.method?.toUpperCase(), response.config?.url, response.status);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('❌ API Error Details:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      baseURL: error.config?.baseURL
    });
    
    // Additional debugging for CORS and network errors
    if (error.message.includes('Network Error') || !error.response) {
      console.error('🌐 Network Error - Possible causes:');
      console.error('- Backend server is down');
      console.error('- CORS configuration issue');
      console.error('- Network connectivity problem');
      console.error('- Incorrect API URL:', error.config?.baseURL);
    }
    
    // Don't automatically redirect on 401 - let components handle it
    return Promise.reject(error);
  }
);

// Dashboard API - Since there's no dedicated dashboard endpoint, fetch from multiple endpoints
export const dashboardAPI = {
  getStats: async () => {
    try {
      console.log('Fetching dashboard stats from individual endpoints...');
      
      // Fetch all data from individual endpoints
      const [
        activitiesRes,
        bookingsRes,
        usersRes,
        contactsRes,
        airportBookingsRes
      ] = await Promise.allSettled([
        API.get('/activities'),
        API.get('/bookings'),
        API.get('/users'),
        API.get('/contact'),
        API.get('/airport-transfer-bookings')
      ]);

      // Helper function to extract data from promises
      const extractData = (result) => {
        if (result.status === 'fulfilled' && result.value && result.value.data) {
          const data = result.value.data;
          
          // Handle different response formats
          if (Array.isArray(data)) {
            return data;
          } else if (data.data && Array.isArray(data.data)) {
            return data.data;
          } else if (data.result && Array.isArray(data.result)) {
            return data.result;
          } else if (data.success && data.data && Array.isArray(data.data)) {
            return data.data;
          }
        }
        return [];
      };

      // Process the data
      const activities = extractData(activitiesRes);
      const bookings = extractData(bookingsRes);
      const users = extractData(usersRes);
      const contacts = extractData(contactsRes);
      const airportBookings = extractData(airportBookingsRes);

      console.log('Dashboard data counts:', {
        activities: activities.length,
        bookings: bookings.length,
        users: users.length,
        contacts: contacts.length,
        airportBookings: airportBookings.length
      });

      // Calculate stats
      const totalActivities = activities.length;
      const totalBookings = bookings.length;
      const totalUsers = users.length;
      const pendingBookings = bookings.filter(b => b.status === 'pending' || b.bookingStatus === 'pending').length;
      
      // Contact stats
      const totalContacts = contacts.length;
      const unreadContacts = contacts.filter(c => 
        c.status === 'unread' || !c.status || c.status === 'new' || c.isRead === false || c.read === false
      ).length;
      
      // Airport transfer stats
      const airportTotal = airportBookings.length;
      const airportPending = airportBookings.filter(b => b.status === 'pending').length;
      const airportConfirmed = airportBookings.filter(b => b.status === 'confirmed').length;
      const airportCompleted = airportBookings.filter(b => b.status === 'completed').length;
      const airportRevenue = airportBookings.reduce((sum, booking) => 
        sum + (parseFloat(booking.totalPrice) || parseFloat(booking.price) || 0), 0
      );
      
      // Recent bookings (last 5)
      const recentBookings = bookings
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.bookingDate || a.date || 0);
          const dateB = new Date(b.createdAt || b.bookingDate || b.date || 0);
          return dateB - dateA;
        })
        .slice(0, 5);
      
      // Recent airport bookings (last 5)
      const recentAirportBookings = airportBookings
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.bookingDate || a.date || 0);
          const dateB = new Date(b.createdAt || b.bookingDate || b.date || 0);
          return dateB - dateA;
        })
        .slice(0, 5);

      // Construct the response in the expected format
      const result = {
        data: {
          success: true,
          data: {
            totalActivities,
            totalBookings,
            totalUsers,
            pendingBookings,
            totalContacts,
            unreadContacts,
            recentBookings,
            recentAirportBookings,
            airportTransfers: {
              totalBookings: airportTotal,
              totalRevenue: airportRevenue,
              pendingBookings: airportPending,
              confirmedBookings: airportConfirmed,
              completedBookings: airportCompleted
            }
          }
        }
      };

      console.log('Dashboard stats calculated:', result.data.data);
      return result;

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return a fallback response with zeros
      return {
        data: {
          success: true,
          data: {
            totalActivities: 0,
            totalBookings: 0,
            totalUsers: 0,
            pendingBookings: 0,
            totalContacts: 0,
            unreadContacts: 0,
            recentBookings: [],
            recentAirportBookings: [],
            airportTransfers: {
              totalBookings: 0,
              totalRevenue: 0,
              pendingBookings: 0,
              confirmedBookings: 0,
              completedBookings: 0
            }
          }
        }
      };
    }
  }
};

// Activities API
export const activitiesAPI = {
  // Store the base URL for external access
  baseUrl: API_URL,
  
  // fetch all activities or filter by query params (e.g., type)
  getAll: async (params) => {
    console.log('🚀 Fetching all activities with params:', params);
    console.log('🔗 Using API base URL:', API.defaults.baseURL);
    
    try {
      // Use the full endpoint - Vite will proxy /api/ requests to the backend
      const response = await API.get('/activities', { params });
      console.log('📦 Activities API response:', response.data);
      return response;
    } catch (error) {
      console.error('💥 Activities API getAll failed:', error);
      throw error;
    }
  },
  getById: (id) => API.get(`/activities/${id}`),
  create: (data) => API.post('/activities', data),
  update: (id, data) => API.put(`/activities/${id}`, data),
  delete: (id) => API.delete(`/activities/${id}`)
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => API.post('/bookings', bookingData),
  getAll: () => API.get('/bookings'),
  getById: (id) => API.get(`/bookings/${id}`),
  getByReference: (reference) => API.get(`/bookings/reference/${reference}`),
  updateStatus: (id, status) => API.put(`/bookings/${id}`, { status }),
  delete: (id) => API.delete(`/bookings/${id}`)
};

// Users API
export const usersAPI = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  create: (userData) => API.post('/users', userData),
  update: (id, userData) => API.put(`/users/${id}`, userData),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  delete: (id) => API.delete(`/users/${id}`),
  getBookingCount: (id) => API.get(`/users/${id}/bookings/count`)
};

// User Bookings API
export const userBookingsAPI = {
  getAll: () => API.get('/user/bookings'),
  getHistory: () => API.get('/user/bookings/history'),
  getUpcoming: () => API.get('/user/bookings/upcoming'),
  getStats: () => API.get('/user/bookings/stats'),
  cancelBooking: (id) => API.put(`/user/bookings/${id}/cancel`)
};

// Function to upload image to Cloudinary
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'maldives_activities');
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwzhs42tz';
  
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Contact API
export const contactAPI = {
  submitContact: (contactData) => API.post('/contact', contactData),
  getAllContacts: () => API.get('/contact'),
  getContactById: (id) => API.get(`/contact/${id}`),
  updateContactStatus: (id, status) => API.put(`/contact/${id}/status`, { status }),
  replyToContact: (id, replyMessage) => API.post(`/contact/${id}/reply`, { replyMessage }),
  deleteContact: (id) => API.delete(`/contact/${id}`),
  getContactStats: () => API.get('/contact/stats'),
  getUserContacts: () => API.get('/contact/user')
};

// Airport Transfer API
export const airportTransferAPI = {
  getAll: (params) => API.get('/airport-transfers', { params }),
  getActive: () => API.get('/airport-transfers/active'),
  getById: (id) => API.get(`/airport-transfers/${id}`),
  create: (data) => API.post('/airport-transfers', data),
  update: (id, data) => API.put(`/airport-transfers/${id}`, data),
  delete: (id) => API.delete(`/airport-transfers/${id}`)
};

// Airport Transfer Booking API
export const airportTransferBookingAPI = {
  createBooking: (data) => API.post('/airport-transfer-bookings', data),
  getAllBookings: (params) => API.get('/airport-transfer-bookings', { params }),
  getBookingStats: () => API.get('/airport-transfer-bookings/stats'),
  getBookingById: (id) => API.get(`/airport-transfer-bookings/${id}`),
  updateBookingStatus: (id, status, adminNotes) => 
    API.put(`/airport-transfer-bookings/${id}/status`, { status, adminNotes }),
  updateBooking: (id, data) => API.put(`/airport-transfer-bookings/${id}`, data),
  deleteBooking: (id) => API.delete(`/airport-transfer-bookings/${id}`),
  getUserBookings: () => API.get('/airport-transfer-bookings/user/my-bookings')
};

// Authentication API
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  logout: () => API.post('/auth/logout'),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (userData) => API.put('/auth/profile', userData),
  changePassword: (passwordData) => API.put('/auth/change-password', passwordData)
};

export default API;