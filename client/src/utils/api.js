// utils/api.js
import axios from 'axios';

// Create axios instance with base URL
const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (typeof envApiUrl === 'string' && !envApiUrl.startsWith('VITE_API_URL=')) 
  ? envApiUrl 
  : 'https://maldives-activity-booking-backend.onrender.com/api/v1';

// Debug logging
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    apiUrl: API_URL,
    mode: import.meta.env.MODE,
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  });
}

// Create axios instance
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },  
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ API Success:', response.config?.method?.toUpperCase(), response.config?.url, response.status);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    try {
      console.log('Fetching dashboard stats...');
      
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

      const extractData = (result) => {
        if (result.status === 'fulfilled' && result.value?.data) {
          const data = result.value.data;
          if (Array.isArray(data)) return data;
          if (data?.data && Array.isArray(data.data)) return data.data;
          if (data?.result && Array.isArray(data.result)) return data.result;
          if (data?.success && data.data && Array.isArray(data.data)) return data.data;
        }
        return [];
      };

      const activities = extractData(activitiesRes);
      const bookings = extractData(bookingsRes);
      const users = extractData(usersRes);
      const contacts = extractData(contactsRes);
      const airportBookings = extractData(airportBookingsRes);

      const result = {
        data: {
          success: true,
          data: {
            totalActivities: activities.length,
            totalBookings: bookings.length,
            totalUsers: users.length,
            pendingBookings: bookings.filter(b => 
              b.status === 'pending' || b.bookingStatus === 'pending'
            ).length,
            totalContacts: contacts.length,
            unreadContacts: contacts.filter(c => 
              !c.status || c.status === 'unread' || c.status === 'new' || c.isRead === false
            ).length,
            recentBookings: bookings
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
              .slice(0, 5),
            recentAirportBookings: airportBookings
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
              .slice(0, 5),
            airportTransfers: {
              totalBookings: airportBookings.length,
              totalRevenue: airportBookings.reduce((sum, booking) => 
                sum + (parseFloat(booking.totalPrice) || parseFloat(booking.price) || 0), 0
              ),
              pendingBookings: airportBookings.filter(b => b.status === 'pending').length,
              confirmedBookings: airportBookings.filter(b => b.status === 'confirmed').length,
              completedBookings: airportBookings.filter(b => b.status === 'completed').length
            }
          }
        }
      };

      return result;

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
  baseUrl: API_URL,
  
  getAll: async (params) => {
    console.log('Fetching activities with params:', params);
    
    try {
      const response = await API.get('/activities', { params });
      return response;
    } catch (error) {
      console.error('Activities API getAll failed:', error);
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

// ENHANCED: Function to upload image to Cloudinary with multiple fallbacks
export const uploadImage = async (file) => {
  console.log('📤 Starting image upload:', {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    fileType: file.type
  });

  // Get Cloudinary configuration - HARDCODED FALLBACKS
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwzhs42tz';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'maldives_activities';
  
  console.log('🔧 Using Cloudinary config:', { cloudName, uploadPreset });

  // METHOD 1: Try direct Cloudinary upload with fetch (most reliable)
  try {
    console.log('🔄 Method 1: Trying direct Cloudinary upload...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // Use fetch instead of axios for Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('⚠️ Direct Cloudinary upload failed:', {
        status: response.status,
        error: errorText
      });
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Direct Cloudinary upload successful!', data.secure_url);
    return data.secure_url;
    
  } catch (directError) {
    console.warn('⚠️ Direct upload failed, trying axios...');
    
    // METHOD 2: Try Cloudinary with axios
    try {
      console.log('🔄 Method 2: Trying Cloudinary with axios...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000
        }
      );
      
      if (response.data.secure_url) {
        console.log('✅ Axios Cloudinary upload successful!', response.data.secure_url);
        return response.data.secure_url;
      }
      
      throw new Error('No secure_url in response');
      
    } catch (axiosError) {
      console.warn('⚠️ Axios Cloudinary upload failed:', axiosError.message);
      
      // METHOD 3: Try backend upload endpoint
      try {
        console.log('🔄 Method 3: Trying backend upload...');
        
        const backendFormData = new FormData();
        backendFormData.append('image', file);
        
        const response = await API.post('/upload/image', backendFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000
        });
        
        if (response.data.success && response.data.url) {
          console.log('✅ Backend upload successful!', response.data.url);
          return response.data.url;
        }
        
        throw new Error('Backend upload failed');
        
      } catch (backendError) {
        console.warn('⚠️ Backend upload failed:', backendError.message);
        
        // METHOD 4: Return a reliable placeholder image
        console.log('🔄 Method 4: Using placeholder image...');
        
        // Return a reliable placeholder from Unsplash
        const placeholderUrl = `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600&q=80&crop=center`;
        
        // Also store locally as data URL for fallback
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        
        // Store in localStorage with timestamp
        const storageKey = `local_image_${Date.now()}_${file.name.replace(/[^a-z0-9]/gi, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify({
          dataUrl,
          fileName: file.name,
          timestamp: Date.now(),
          placeholder: placeholderUrl
        }));
        
        console.log('📸 Stored locally with key:', storageKey);
        
        // Return the placeholder for now, but note it's local
        return {
          url: placeholderUrl,
          isLocal: true,
          storageKey,
          dataUrl, // Include data URL for immediate use
          message: 'Using placeholder image - upload service unavailable'
        };
      }
    }
  }
};

// Helper to get local image from storage
export const getLocalImage = (storageKey) => {
  try {
    const item = localStorage.getItem(storageKey);
    if (item) {
      const data = JSON.parse(item);
      return data.dataUrl || data.placeholder;
    }
  } catch (error) {
    console.error('Error getting local image:', error);
  }
  return null;
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
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return API.post('/auth/logout');
  },
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (userData) => API.put('/auth/profile', userData),
  changePassword: (passwordData) => API.put('/auth/change-password', passwordData)
};

// Test function to verify uploads work
export const testImageUpload = async () => {
  console.log('🧪 Testing image upload functionality...');
  
  try {
    // Create a test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(0, 0, 100, 100);
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
        
        try {
          const result = await uploadImage(testFile);
          console.log('✅ Upload test result:', result);
          resolve(result);
        } catch (error) {
          console.error('❌ Upload test failed:', error);
          resolve({ error: error.message });
        }
      });
    });
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    return { error: error.message };
  }
};

export default API;