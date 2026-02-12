const mongoose = require('mongoose');

const claimedOfferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  offerText: {
    type: String,
    required: true
  },
  discountCode: {
    type: String,
    required: true
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired'],
    default: 'active'
  },
  expiryDate: {
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 days from now
  }
});

module.exports = mongoose.model('ClaimedOffer', claimedOfferSchema);
