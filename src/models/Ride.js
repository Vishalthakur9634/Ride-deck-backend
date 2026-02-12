const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  pickup: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    address: String,
  },
  stops: [{
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    address: String,
    order: Number
  }],
  dropoff: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
    address: String,
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'cab', 'go', 'premier', 'xl'],
    required: true,
  },
  fare: Number, // The final agreed fare
  riderOffer: Number, // Initial offer by rider
  minPrice: Number, // Suggestion lower bound
  maxPrice: Number, // Suggestion upper bound
  offers: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    vehicleType: String,
    eta: Number,
    rating: Number,
    driverName: String,
    vehicleNumber: String,
    createdAt: { type: Date, default: Date.now }
  }],
  paymentMethod: {
    type: String,
    enum: ['wallet', 'cash'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['searching', 'negotiating', 'booked', 'arrived', 'started', 'completed', 'cancelled', 'scheduled'],
    default: 'searching',
  },
  isScheduled: {
    type: Boolean,
    default: false,
  },
  scheduledTime: {
    type: Date,
  },
  otp: String, // For ride start verification
  riderRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  riderReview: String,
  driverReview: String,
  priceLocked: {
    type: Boolean,
    default: true,
  },
  safetyStatus: {
    type: String,
    enum: ['normal', 'anomaly', 'emergency'],
    default: 'normal',
  },
  fareSplit: {
    brand: Number,
  },
  isDelivery: {
    type: Boolean,
    default: false,
  },
  deliveryDetails: {
    packageType: String,
    packageSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra_large'],
    },
    receiverName: String,
    receiverPhone: String,
    weight: String,
  },
  preferences: [String],
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

rideSchema.pre('save', function () {
  if (!this.otp) {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  }
});

rideSchema.index({ 'pickup': '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
