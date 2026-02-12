const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/authMiddleware');

// Get wallet balance and transaction history
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance loyaltyPoints');
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      balance: user.walletBalance,
      points: user.loyaltyPoints,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Add money to wallet (Simulated)
router.post('/add-money', auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  try {
    const user = await User.findById(req.user._id);
    user.walletBalance += amount;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      amount,
      type: 'credit',
      category: 'wallet_topup',
      status: 'success',
      description: 'Wallet Top-up'
    });
    await transaction.save();

    res.json({ message: 'Money added successfully', balance: user.walletBalance, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Withdraw money (Drivers only usually, but we'll allow all for now or check role)
router.post('/withdraw', auth, async (req, res) => {
  const { amount, bankDetails } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.walletBalance -= amount;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      amount,
      type: 'debit',
      category: 'withdrawal',
      status: 'success', // Simulated instant success
      description: 'Withdrawal to Bank',
      paymentMethod: 'upi' // or bank_transfer
    });
    await transaction.save();

    res.json({ message: 'Withdrawal successful', balance: user.walletBalance, transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
