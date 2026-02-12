const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Ride = require('../models/Ride');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', auth, async (req, res) => {
  const { rideId, revieweeId, rating, comment } = req.body;
  const reviewerId = req.user._id;

  try {
    // Check if ride exists and is completed
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed rides' });
    }

    // Check if user was part of the ride
    if (ride.riderId.toString() !== reviewerId.toString() && ride.driverId.toString() !== reviewerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this ride' });
    }

    const review = new Review({
      rideId,
      reviewerId,
      revieweeId,
      rating,
      comment,
    });

    await review.save();

    // Update reviewee's average rating
    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      const totalRatings = reviewee.totalRatings + 1;
      const currentRating = reviewee.rating || 5;
      const newRating = ((currentRating * reviewee.totalRatings) + rating) / totalRatings;
      
      reviewee.rating = Number(newRating.toFixed(1));
      reviewee.totalRatings = totalRatings;
      await reviewee.save();
    }

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this ride' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get all reviews for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.userId })
      .populate('reviewerId', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
