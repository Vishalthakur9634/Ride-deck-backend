const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  profilePicture: String,
  // Driver specific fields
  vehicleType: {
    type: String,
    enum: ['bike', 'auto', 'cab'],
  },
  vehicleNumber: String,
  licenseNumber: String,
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'none'],
    default: 'none',
  },
  subscriptionType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'none'],
    default: 'none',
  },
  subscriptionExpiry: Date,
  autoRenew: {
    type: Boolean,
    default: false,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [77.2090, 28.6139], // Default to New Delhi
    },
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  bankAccount: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    holderName: String,
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'none'],
    default: 'none',
  },
  kycDocuments: {
    license: String,
    rc: String,
    selfie: String,
    insurance: String,
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
  acceptanceRate: {
    type: Number,
    default: 100,
  },
  optedInCampaigns: {
    type: [String],
    default: [],
  },
  savedPlaces: [{
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    icon: { type: String, default: 'map-pin' } // home, work, gym, etc.
  }],
}, { timestamps: true });

userSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
