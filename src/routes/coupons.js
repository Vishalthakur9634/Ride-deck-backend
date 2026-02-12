const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { auth } = require('../middleware/authMiddleware');

// Validate a coupon
router.post('/validate', auth, async (req, res) => {
    const { code, fare } = req.body;

    try {
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        if (coupon.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }

        if (coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        if (fare < coupon.minFare) {
            return res.status(400).json({ message: `Minimum fare of ₹${coupon.minFare} required` });
        }

        let discount = 0;
        if (coupon.discountType === 'flat') {
            discount = coupon.value;
        } else {
            discount = (fare * coupon.value) / 100;
        }

        discount = Math.min(discount, coupon.maxDiscount);

        res.json({
            valid: true,
            discount,
            code: coupon.code,
            message: 'Coupon applied successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// List available public coupons
router.get('/', auth, async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isActive: true,
            expiresAt: { $gt: new Date() },
            usageCount: { $lt: 10000 } // approximate check
        }).limit(5);
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
