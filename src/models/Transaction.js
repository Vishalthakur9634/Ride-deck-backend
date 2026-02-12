const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  category: {
    type: String,
    enum: ['ride_fare', 'wallet_topup', 'withdrawal', 'referral_bonus', 'refund', 'subscription'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'success',
  },
  description: String,
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'cash', 'card', 'upi'],
    default: 'wallet',
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
