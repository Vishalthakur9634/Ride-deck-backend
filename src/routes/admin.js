const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const { auth, authorize } = require('../middleware/authMiddleware');


router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalRides, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'rider' }),
      User.countDocuments({ role: 'driver' }),
      Ride.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { category: 'ride_fare' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      totalUsers,
      totalDrivers,
      totalRides,
      revenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.get('/drivers/pending', auth, authorize('admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', kycStatus: 'pending' });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.get('/drivers', auth, authorize('admin'), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.post('/drivers/verify', auth, authorize('admin'), async (req, res) => {
  const { driverId, status } = req.body;
  try {
    const driver = await User.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.kycStatus = status;
    if (status === 'verified') driver.isVerified = true;
    await driver.save();


    const io = req.app.get('io');
    if (io) {

      io.to(driverId.toString()).emit('kyc-status-update', {
        status,
        message: `Your KYC has been ${status}`
      });
    }

    res.json({ message: `Driver KYC ${status} successfully`, driver });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.post('/users/:id/ban', auth, authorize('admin'), async (req, res) => {
  const { isBanned } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = isBanned;

    if (isBanned && user.role === 'driver') {
      user.isOnline = false;
    }
    await user.save();

    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.get('/rides/active', auth, authorize('admin'), async (req, res) => {
  try {
    const rides = await Ride.find({ status: { $in: ['accepted', 'started'] } })
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ updatedAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.get('/rides', auth, authorize('admin'), async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.post('/rides/:id/cancel', auth, authorize('admin'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }


    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({ message: `Ride is already ${ride.status}` });
    }

    const previousStatus = ride.status;
    ride.status = 'cancelled';
    ride.driverId = null;
    await ride.save();


    const io = req.app.get('io');
    if (io) {
      if (ride.riderId) {
        io.to(ride.riderId.toString()).emit('rideStatusUpdate', {
          ...ride.toObject(),
          status: 'cancelled',
          message: 'Ride cancelled by Admin'
        });
      }

    }

    res.json({ message: 'Ride force cancelled successfully', ride });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(100);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/sos', auth, authorize('admin'), async (req, res) => {
  try {
    // Assuming we store SOS alerts in a model or just rides with safetyStatus 'emergency'
    const sosRides = await Ride.find({ safetyStatus: 'emergency' })
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ updatedAt: -1 });
    res.json(sosRides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
