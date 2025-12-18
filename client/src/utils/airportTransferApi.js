import API from './api';

// Airport Transfer API
export const airportTransferAPI = {
  // Get all airport transfers (admin)
  getAll: (params) => API.get('/airport-transfers', { params }),
  
  // Get active airport transfers (public)
  getActive: () => API.get('/airport-transfers/active'),
  
  // Get single transfer
  getById: (id) => API.get(`/airport-transfers/${id}`),
  
  // Create transfer (admin)
  create: (data) => API.post('/airport-transfers', data),
  
  // Update transfer (admin)
  update: (id, data) => API.put(`/airport-transfers/${id}`, data),
  
  // Delete transfer (admin)
  delete: (id) => API.delete(`/airport-transfers/${id}`)
};

// Airport Transfer Booking API
export const airportTransferBookingAPI = {
  // Create booking (public)
  createBooking: (data) => API.post('/airport-transfer-bookings', data),
  
  // Get all bookings (admin)
  getAllBookings: (params) => API.get('/airport-transfer-bookings', { params }),
  
  // Get booking stats (admin)
  getBookingStats: () => API.get('/airport-transfer-bookings/stats'),
  
  // Get single booking
  getBookingById: (id) => API.get(`/airport-transfer-bookings/${id}`),
  
  // Update booking status (admin)
  updateBookingStatus: (id, status, adminNotes) => 
    API.put(`/airport-transfer-bookings/${id}/status`, { status, adminNotes }),
  
  // Update booking
  updateBooking: (id, data) => API.put(`/airport-transfer-bookings/${id}`, data),
  
  // Delete booking (admin)
  deleteBooking: (id) => API.delete(`/airport-transfer-bookings/${id}`),
  
  // Get user's bookings
  getUserBookings: () => API.get('/airport-transfer-bookings/user/my-bookings'),
  getBookingsByDateRange: (startDate, endDate) => 
  API.get(`/airport-transfer-bookings/report?startDate=${startDate}&endDate=${endDate}`),
  
};