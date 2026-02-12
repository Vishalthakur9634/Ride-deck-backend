const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/authMiddleware');
const checkSubscription = require('../middleware/checkSubscription');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.post('/subscribe', auth, authorize('driver'), async (req, res) => {
  const { type } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let durationDays = 0;
    if (type === 'daily') durationDays = 1;
    else if (type === 'weekly') durationDays = 7;
    else if (type === 'monthly') durationDays = 30;
    else return res.status(400).json({ message: 'Invalid subscription type' });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    user.subscriptionStatus = 'active';
    user.subscriptionType = type;
    user.subscriptionExpiry = expiry;
    await user.save();

    res.json({
      success: true,
      message: `Subscribed to ${type} plan successfully`,
      user: {
        ...user.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.post('/status', auth, authorize('driver'), checkSubscription, async (req, res) => {
  const { isOnline } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isOnline) {
      if (user.kycStatus !== 'verified') {
        return res.status(403).json({ message: 'KYC not verified. Please complete your KYC to go online.' });
      }
      if (user.subscriptionStatus !== 'active' || (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date())) {
        user.subscriptionStatus = 'expired';
        await user.save();
        return res.status(403).json({ message: 'Subscription expired. Please renew to go online.' });
      }

      const { lat, lng } = req.body;
      if (lat && lng) {
        user.currentLocation = {
          type: 'Point',
          coordinates: [lng, lat]
        };
      }
    }
    user.isOnline = isOnline;
    await user.save();

    res.json({ success: true, isOnline: user.isOnline });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const Ride = require('../models/Ride');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayTransactions, totalRides, user] = await Promise.all([
      Transaction.find({
        userId: req.user._id,
        category: 'ride_fare',
        createdAt: { $gte: today }
      }),
      Ride.countDocuments({ driverId: req.user._id, status: 'completed' }),
      User.findById(req.user._id).select('walletBalance')
    ]);

    const todayEarnings = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      todayEarnings,
      totalRides,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/earnings-history', auth, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const history = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTransactions = await Transaction.find({
        userId: req.user._id,
        category: 'ride_fare',
        createdAt: { $gte: date, $lt: nextDate }
      });

      const amount = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      history.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount
      });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user) return cb(new Error('User not authenticated in upload'));

    const dir = path.join(process.cwd(), 'uploads/kyc/');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    if (!req.user) return cb(new Error('User not authenticated in upload'));
    cb(null, `${req.user._id}-${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed!'));
  }
});

const uploadMiddleware = upload.fields([
  { name: 'license', maxCount: 1 },
  { name: 'rc', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'insurance', maxCount: 1 }
]);

router.post('/kyc', auth, authorize('driver'), (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}`, error: err.code });
      }
      return res.status(500).json({ message: `Server upload error: ${err.message}`, error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'Please upload all required documents' });
    }

    const API_URL = process.env.API_URL || 'http://localhost:5001';

    const getFilePath = (fieldName) => {
      if (req.files && req.files[fieldName] && req.files[fieldName][0]) {

        return `${API_URL}/${req.files[fieldName][0].path.replace(/\\/g, '/')}`;
      }
      return user.kycDocuments ? user.kycDocuments[fieldName] : undefined;
    };

    const kycDocuments = {
      license: getFilePath('license'),
      rc: getFilePath('rc'),
      selfie: getFilePath('selfie'),
      insurance: getFilePath('insurance')
    };

    user.kycDocuments = kycDocuments;
    user.kycStatus = 'verified'; // Instant activation for development/demo

    await user.save();

    res.json({ message: 'KYC documents submitted successfully', kycStatus: user.kycStatus, documents: kycDocuments });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
