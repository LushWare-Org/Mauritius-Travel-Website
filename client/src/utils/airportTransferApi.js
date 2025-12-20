import API from './api';

// Airport Transfer API
// Airport Transfer API
export const airportTransferAPI = {
  getAll: (params) => API.get('/airport-transfers', { params }),
  getActive: () => API.get('/airport-transfers/active'),
  getById: (id) => API.get(`/airport-transfers/${id}`),
  create: (data) => API.post('/airport-transfers', data),
  update: (id, data) => API.put(`/airport-transfers/${id}`, data),
  updateExchangeRate: (data) => API.put('/airport-transfers/update-exchange-rate', data),
  delete: (id) => API.delete(`/airport-transfers/${id}`),
  getBookingsByDateRange: (startDate, endDate) => 
    API.get(`/airport-transfer-bookings/report?startDate=${startDate}&endDate=${endDate}`),
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