const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  radius: {
    type: Number, // in meters
    required: true,
    default: 500
  },
  activeHours: {
    start: { type: Number, min: 0, max: 2359 }, // e.g., 1400 for 2 PM
    end: { type: Number, min: 0, max: 2359 }    // e.g., 1800 for 6 PM
  },
  activeDays: [{
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location queries
campaignSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Campaign', campaignSchema);
