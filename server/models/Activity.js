const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  
  // Dual Currency Pricing Fields
  // USD Prices (existing)
  price: {
    type: Number,
    required: [true, 'Please add USD price'],
    min: [0, 'Price cannot be negative'],
  },
  fullDayPrice: {
    type: Number,
    required: [true, 'Please add USD full day price'],
    min: [0, 'Full day price cannot be negative'],
  },
  halfDayPrice: {
    type: Number,
    required: [true, 'Please add USD half day price'],
    min: [0, 'Half day price cannot be negative'],
  },
  
  // EUR Prices (new)
  priceEUR: {
    type: Number,
    required: [true, 'Please add EUR price'],
    min: [0, 'EUR price cannot be negative'],
  },
  fullDayPriceEUR: {
    type: Number,
    required: [true, 'Please add EUR full day price'],
    min: [0, 'EUR full day price cannot be negative'],
  },
  halfDayPriceEUR: {
    type: Number,
    required: [true, 'Please add EUR half day price'],
    min: [0, 'EUR half day price cannot be negative'],
  },
  
  // MUR Prices (new)
  priceMUR: {
    type: Number,
    required: [true, 'Please add MUR price'],
    min: [0, 'MUR price cannot be negative'],
  },
  fullDayPriceMUR: {
    type: Number,
    required: [true, 'Please add MUR full day price'],
    min: [0, 'MUR full day price cannot be negative'],
  },
  halfDayPriceMUR: {
    type: Number,
    required: [true, 'Please add MUR half day price'],
    min: [0, 'MUR half day price cannot be negative'],
  },
  
  // Currency configuration
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'MUR'],
    default: 'USD'
  },
  displayCurrency: {
    type: String,
    enum: ['USD', 'EUR', 'MUR'],
    default: 'USD'
  },
  
  duration: {
    type: Number,
    required: [true, 'Please add duration'],
  },
  location: {
    type: String,
    required: [true, 'Please add location'],
  },
  type: {
    type: String,
    required: [true, 'Please add activity type'],
    enum: [
      'water-sports',
      'cruises',
      'island-tours',
      'diving',
      'adventure',
      'cultural',
      'wellness',
    ],
  },
  image: {
    type: String,
    required: [true, 'Please add an image'],
  },
  galleryImages: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  maxParticipants: {
    type: Number,
    default: 10,
  },
  included: {
    type: [String],
    default: [],
  },
  notIncluded: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
  },
  featured: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
activitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware to set USD price as default if not provided
activitySchema.pre('save', function(next) {
  if (!this.price && this.fullDayPrice) {
    this.price = this.fullDayPrice;
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);