const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Brand = require('../models/Brand');
const Coupon = require('../models/Coupon');
const { auth } = require('../middleware/authMiddleware');


router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and Longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);


    const campaigns = await Campaign.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 2000
        }
      },
      isActive: true
    }).populate('brandId', 'name logo category');


    const now = new Date();
    const currentHour = now.getHours() * 100 + now.getMinutes();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = days[now.getDay()];

    const activeCampaigns = campaigns.filter(c => {

      if (!c.activeDays.includes(currentDay)) return false;

      if (currentHour < c.activeHours.start || currentHour > c.activeHours.end) return false;
      return true;
    });


    if (activeCampaigns.length > 0) {
      res.json(activeCampaigns[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching nearby brands:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/all-active', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ isActive: true }).populate('brandId', 'name logo category');
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching active campaigns:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.post('/save-coupon', auth, async (req, res) => {
  try {
    const { campaignId } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }


    const existing = await Coupon.findOne({ userId: req.user._id, campaignId });
    if (existing) {
      return res.status(400).json({ message: 'Coupon already saved' });
    }

    const coupon = new Coupon({
      userId: req.user._id,
      campaignId,
      code: campaign.code
    });

    await coupon.save();

    res.json({ message: 'Coupon saved to wallet!', coupon });
  } catch (error) {
    console.error('Error saving coupon:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.get('/my-coupons', auth, async (req, res) => {
  try {
    const coupons = await Coupon.find({ userId: req.user._id })
      .sort({ savedAt: -1 })
      .populate({
        path: 'campaignId',
        populate: { path: 'brandId' }
      });

    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
