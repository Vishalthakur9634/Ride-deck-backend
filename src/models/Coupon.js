const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: String,
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  minFare: {
    type: Number,
    default: 0,
  },
  maxDiscount: {
    type: Number,
    default: 1000,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: 10000,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
