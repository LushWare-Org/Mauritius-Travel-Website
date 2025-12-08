const mongoose = require('mongoose');

const TourPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  itinerary: {
    type: [String],
    default: []
  },
  included: {
    type: [String], 
    default: []
  },
  notIncluded: {
    type: [String],
    default: ['Entrance fees']
  },
  image: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  galleryImages: {
    type: [String],
    default: []
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: val => Math.round(val * 10) / 10 // Round to 1 decimal
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TourPackage', TourPackageSchema);
