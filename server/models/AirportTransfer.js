const mongoose = require('mongoose');

const AirportTransferSchema = new mongoose.Schema({
  airportName: {
    type: String,
    required: [true, 'Please add airport name'],
    trim: true
  },
  airportCode: {
    type: String,
    required: [true, 'Please add airport code'],
    uppercase: true,
    trim: true
  },
  
  // One-way prices in both currencies
  oneWayPriceMUR: {
    type: Number,
    required: [true, 'Please add one-way price in MUR'],
    min: [0, 'Price cannot be negative']
  },
  oneWayPriceEUR: {
    type: Number,
    required: [true, 'Please add one-way price in EUR'],
    min: [0, 'Price cannot be negative']
  },
  
  // Round-trip prices in both currencies
  roundTripPriceMUR: {
    type: Number,
    required: [true, 'Please add round-trip price in MUR'],
    min: [0, 'Price cannot be negative']
  },
  roundTripPriceEUR: {
    type: Number,
    required: [true, 'Please add round-trip price in EUR'],
    min: [0, 'Price cannot be negative']
  },
  
  description: {
    type: String,
    trim: true
  },
  estimatedTime: {
    type: String,
    default: '30-45 minutes'
  },
  capacity: {
    type: Number,
    default: 4,
    min: [1, 'Capacity must be at least 1']
  },
  vehicleType: {
    type: String,
    enum: ['car', 'van', 'bus', 'speedboat', 'seaplane'],
    default: 'car'
  },
  isActive: {
    type: Boolean,
    default: true
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



module.exports = mongoose.model('AirportTransfer', AirportTransferSchema);