const mongoose = require('mongoose');

const tourPackageBookingSchema = new mongoose.Schema({
  tourPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourPackage',
    required: [true, 'Tour package is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  guests: {
    type: Number,
    required: [true, 'Number of guests is required'],
    min: [1, 'At least 1 guest is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  // KEEP existing fields
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Price cannot be negative']
  },
  // ADD new fields for dual currency
  currency: {
    type: String,
    enum: ['MUR', 'EUR'],
    default: 'MUR'
  },
  // Store prices in both currencies for record
  totalPriceEur: {
    type: Number,
    default: 0
  },
  totalPriceMur: {
    type: Number,
    default: function() {
      return this.totalPrice;
    }
  },
  
  selectedActivities: [{
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    },
    price: {
      type: Number,
      required: true
    },
    priceEur: {  // NEW: Add EUR price
      type: Number,
      default: 0
    },
    title: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    currency: {  // NEW: Store activity currency
      type: String,
      enum: ['MUR', 'EUR'],
      default: 'MUR'
    }
  }],
  
  activitiesTotal: {
    type: Number,
    default: 0
  },
  activitiesTotalEur: {  // NEW: EUR version
    type: Number,
    default: 0
  },
  
  packagePrice: {
    type: Number,
    default: 0
  },
  packagePriceEur: {  // NEW: EUR version
    type: Number,
    default: 0
  },
  
  specialRequests: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true,
    default: function() {
      const prefix = 'TP';
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      return `${prefix}${randomNum}`;
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    trim: true
  },
  airportTransferBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AirportTransferBooking'
  },
  transferTotal: {
    type: Number,
    default: 0
  },
  transferTotalEur: {  // NEW: EUR version
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate booking reference before saving
tourPackageBookingSchema.pre('save', async function(next) {
  console.log('=== PRE-SAVE HOOK START ===');
  console.log('Document data:', this);
  console.log('Is new document?', this.isNew);
  console.log('Current bookingReference:', this.bookingReference);
  
  if (!this.bookingReference) {
    console.log('Generating booking reference...');
    const prefix = 'TP';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.bookingReference = `${prefix}${randomNum}`;
    console.log('Generated booking reference:', this.bookingReference);
  } else {
    console.log('Booking reference already exists:', this.bookingReference);
  }
  
  console.log('=== PRE-SAVE HOOK END ===');
  next();
});

// Virtual for checking if booking is upcoming
tourPackageBookingSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const startDate = new Date(this.startDate);
  return startDate > now && this.status === 'confirmed';
});

// Virtual for checking if booking is past
tourPackageBookingSchema.virtual('isPast').get(function() {
  const now = new Date();
  const startDate = new Date(this.startDate);
  return startDate < now;
});

module.exports = mongoose.model('TourPackageBooking', tourPackageBookingSchema);