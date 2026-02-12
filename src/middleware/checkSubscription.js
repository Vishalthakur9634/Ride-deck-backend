const User = require('../models/User');

const checkSubscription = async (req, res, next) => {
  try {
    // Only check for drivers
    if (req.user.role !== 'driver') {
      return next();
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is active
    if (user.subscriptionStatus !== 'active') {
      return res.status(403).json({ 
        message: 'Subscription required. Please subscribe to continue receiving rides.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // Check for expiry
    if (user.subscriptionExpiry && new Date() > new Date(user.subscriptionExpiry)) {
      // Auto-expire if date passed
      user.subscriptionStatus = 'expired';
      await user.save();
      
      return res.status(403).json({ 
        message: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ message: 'Server Error during subscription check' });
  }
};

module.exports = checkSubscription;
