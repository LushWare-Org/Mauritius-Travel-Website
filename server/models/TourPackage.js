const mongoose = require('mongoose');

const TourPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters'],
  },
  // Dual currency support
  price: {
    type: Number,
    required: [true, 'Please add a price in MUR'],
  },
  priceEur: {
    type: Number,
    default: 0, // or simply omit default entirely
    min: 0,
  },
  supportsCurrency: {
    type: String,
    enum: ['rs-only', 'eur-only', 'both'],
    default: 'both',
  },

  itinerary: {
    type: [String],
    default: [],
  },
  included: {
    type: [String],
    default: [],
  },
  notIncluded: {
    type: [String],
    default: ['Entrance fees'],
  },
  image: {
    type: String,
    required: [true, 'Please add an image URL'],
  },
  galleryImages: {
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
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: (val) => Math.round(val * 10) / 10,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add helper method to get price in specific currency
TourPackageSchema.methods.getPriceInCurrency = function (currency = 'MUR') {
  if (currency === 'EUR' && this.priceEur) {
    return this.priceEur;
  }
  return this.price; // Default to MUR price
};

module.exports = mongoose.model('TourPackage', TourPackageSchema);
