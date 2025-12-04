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
  // Keep price for backward compatibility
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative'],
  },
  // Add new price fields
  fullDayPrice: {
    type: Number,
    required: [true, 'Please add full day price'],
    min: [0, 'Full day price cannot be negative'],
  },
  halfDayPrice: {
    type: Number,
    required: [true, 'Please add half day price'],
    min: [0, 'Half day price cannot be negative'],
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

// Middleware to set price from fullDayPrice if not provided
activitySchema.pre('save', function(next) {
  if (!this.price && this.fullDayPrice) {
    this.price = this.fullDayPrice;
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);