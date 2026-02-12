const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Food & Beverage', 'Retail', 'Essentials', 'Entertainment', 'Other']
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Brand', brandSchema);
