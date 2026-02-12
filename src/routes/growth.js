const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// @route   GET /api/growth/referral
// @desc    Get user's referral code and stats
// @access  Private
router.get('/referral', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    
    // Generate referral code if not exists
    if (!user.referralCode) {
      user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      await user.save();
    }

    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      loyaltyPoints: user.loyaltyPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/growth/referral/apply
// @desc    Apply a referral code
// @access  Private
router.post('/referral/apply', auth, async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (user.referredBy) {
      return res.status(400).json({ message: 'Referral code already applied' });
    }

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    if (referrer._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot refer yourself' });
    }

    user.referredBy = referrer._id;
    referrer.referralCount += 1;
    
    // Reward both (Mock reward: 50 loyalty points)
    user.loyaltyPoints += 50;
    referrer.loyaltyPoints += 100;

    await Promise.all([user.save(), referrer.save()]);

    res.json({ 
      message: 'Referral code applied successfully!',
      loyaltyPoints: user.loyaltyPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
