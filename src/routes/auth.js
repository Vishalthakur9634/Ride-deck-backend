const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const authLimiter = (req, res, next) => next(); // Disabled for development


router.post(
  '/register',
  authLimiter,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('phone', 'Please include a valid phone number').isLength({ min: 10 }),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['rider', 'driver']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, role, vehicleType, vehicleNumber } = req.body;

    try {
      let user = await User.findOne({ phone });

      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      user = new User({
        name,
        phone,
        password: hashedPassword,
        role,
        vehicleType,
        vehicleNumber,
        kycStatus: role === 'driver' ? 'verified' : 'none',
        subscriptionStatus: role === 'driver' ? 'active' : 'none',
        subscriptionType: role === 'driver' ? 'monthly' : 'none',
        subscriptionExpiry: role === 'driver' ? expiry : undefined,
        referralCode: require('voucher-code-generator').generate({ length: 6, count: 1, charset: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' })[0]
      });

      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    check('phone', 'Phone number is required').not().isEmpty(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    try {
      const user = await User.findOne({ phone });

      if (!user) {
        return res.status(400).json({ message: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid Credentials' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

router.get('/me', require('../middleware/authMiddleware').auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
