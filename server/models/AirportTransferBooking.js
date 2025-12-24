const mongoose = require('mongoose');

const AirportTransferBookingSchema = new mongoose.Schema({
  transfer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AirportTransfer',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  guestName: {
    type: String,
    required: [true, 'Please add guest name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add email'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number'],
    trim: true
  },
  flightNumber: {
    type: String,
    trim: true
  },
  arrivalDate: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  departureDate: {
    type: Date
  },
  departureTime: {
    type: String
  },
  tripType: {
    type: String,
    enum: ['one-way', 'round-trip'],
    required: true
  },
  transferType: {
    type: String,
    enum: ['airport-to-hotel', 'hotel-to-airport', 'both'],
    required: true
  },
  passengers: {
    type: Number,
    required: true,
    min: [1, 'At least 1 passenger required'],
    max: [20, 'Maximum 20 passengers allowed']
  },
  specialRequests: {
    type: String,
    trim: true
  },
  
  // Currency fields
  currency: {
    type: String,
    enum: ['EUR', 'MUR'],
    default: 'MUR'
  },
  
  currencySymbol: {
    type: String,
    enum: ['€', 'Rs'],
    default: 'Rs'
  },
  
  totalPrice: {
    type: Number,
    required: true
  },
  
  // Store prices in both currencies for reference
  prices: {
    EUR: {
      totalPrice: Number
    },
    MUR: {
      totalPrice: Number
    }
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  confirmationDate: {
    type: Date
  },
  isGuestBooking: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware
AirportTransferBookingSchema.pre('save', async function(next) {
  // Set currency symbol
  if (this.currency === 'MUR') {
    this.currencySymbol = 'Rs';
  } else {
    this.currencySymbol = '€';
  }
  
  // Initialize prices object
  if (!this.prices) {
    this.prices = {
      EUR: {},
      MUR: {}
    };
  }
  
  // Store price in the selected currency
  if (this.currency === 'MUR') {
    this.prices.MUR.totalPrice = this.totalPrice;
  } else {
    this.prices.EUR.totalPrice = this.totalPrice;
  }
  
  // Generate booking reference
  if (!this.bookingReference) {
    const count = await mongoose.model('AirportTransferBooking').countDocuments();
    this.bookingReference = `TRF-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(4, '0')}`;
  }
  
  // Set isGuestBooking flag
  this.isGuestBooking = !this.user;
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AirportTransferBooking', AirportTransferBookingSchema);