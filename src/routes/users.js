const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/authMiddleware');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/users/update/:id
// @desc    Update user profile (Admin/Self)
// @access  Private
router.put('/update/:id', auth, async (req, res) => {
  try {
    // Ensure user is updating their own profile
    if (req.params.id !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, email, phone } = req.body;

    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/users/saved-places
// @desc    Add a saved place
// @access  Private
router.post('/saved-places', auth, async (req, res) => {
  const { name, address, lat, lng, icon } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedPlaces.push({ name, address, lat, lng, icon });
    await user.save();

    res.json(user.savedPlaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   DELETE /api/users/saved-places/:id
// @desc    Remove a saved place
// @access  Private
router.delete('/saved-places/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedPlaces = user.savedPlaces.filter(place => place._id.toString() !== req.params.id);
    await user.save();

    res.json(user.savedPlaces);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/users/apply-referral
// @desc    Apply a referral code
// @access  Private
router.post('/apply-referral', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Referral code is required' });

  try {
    const user = await User.findById(req.user._id);
    if (user.referredBy) {
      return res.status(400).json({ message: 'You have already applied a referral code' });
    }

    if (user.referralCode === code) {
      return res.status(400).json({ message: 'You cannot refer yourself' });
    }

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    // Reward amount
    const rewardAmount = 50;

    // Credit Referrer
    referrer.walletBalance += rewardAmount;
    referrer.referralCount += 1;
    await referrer.save();

    // Credit User (Referee)
    user.walletBalance += rewardAmount;
    user.referredBy = referrer._id;
    await user.save();

    // Create Transactions
    const Transaction = require('../models/Transaction');

    await Transaction.create([
      {
        userId: referrer._id,
        amount: rewardAmount,
        type: 'credit',
        category: 'referral_bonus',
        description: `Referral bonus for inviting ${user.name}`,
        status: 'success'
      },
      {
        userId: user._id,
        amount: rewardAmount,
        type: 'credit',
        category: 'referral_bonus',
        description: `Referral bonus for joining via ${referrer.name}`,
        status: 'success'
      }
    ]);

    res.json({ message: `Referral applied! You received ₹${rewardAmount}`, balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
