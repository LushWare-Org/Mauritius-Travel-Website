const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, 'Activity is required']
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  guests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: [1, 'At least 1 guest is required']
  },
  durationType: {
    type: String,
    enum: ['Half Day', 'Full Day'],
    required: false
  },
  
  // Currency information
  currency: {
    type: String,
    enum: ['EUR', 'MUR'],
    default: 'MUR',
    required: [true, 'Currency is required']
  },
  
  // Store currency symbol for display
  currencySymbol: {
    type: String,
    enum: ['€', 'Rs'],
    default: 'Rs'
  },
  
  // Price fields - store in selected currency
  pricePerPerson: {
    type: Number,
    required: [true, 'Price per person is required'],
    min: [0, 'Price per person cannot be negative']
  },
  
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  
  // Store prices in both currencies for reference
  prices: {
    EUR: {
      pricePerPerson: Number,
      totalPrice: Number
    },
    MUR: {
      pricePerPerson: Number,
      totalPrice: Number
    }
  },
  
  fullName: {
    type: String,
    required: [true, 'Full name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  countryCode: {
    type: String,
    default: '+230'
  },
  specialRequests: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to set currency symbol based on currency
BookingSchema.pre('save', function(next) {
  if (this.currency === 'MUR') {
    this.currencySymbol = 'Rs';
  } else {
    this.currencySymbol = '€';
  }
  
  // Ensure both currency prices are stored
  if (!this.prices) {
    this.prices = {
      EUR: {},
      MUR: {}
    };
  }
  
  // Store price in the selected currency
  if (this.currency === 'MUR') {
    this.prices.MUR.pricePerPerson = this.pricePerPerson;
    this.prices.MUR.totalPrice = this.totalPrice;
  } else {
    this.prices.EUR.pricePerPerson = this.pricePerPerson;
    this.prices.EUR.totalPrice = this.totalPrice;
  }
  
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);