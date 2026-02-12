const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function cleanAdminUser() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ridedeck';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ phone: '09756812554' });
    if (admin) {
      console.log(`Found admin user: ${admin.name}`);
      

      const fieldsToUnset = {
        vehicleType: 1,
        vehicleNumber: 1,
        licenseNumber: 1,
        subscriptionStatus: 1,
        subscriptionType: 1,
        subscriptionExpiry: 1,
        autoRenew: 1,
        isOnline: 1,
        currentLocation: 1,
        walletBalance: 1,
        bankAccount: 1,
        kycStatus: 1,
        kycDocuments: 1,
        rating: 1,
        totalRatings: 1,
        referralCode: 1,
        referredBy: 1,
        referralCount: 1,
        loyaltyPoints: 1,
        acceptanceRate: 1,
        optedInCampaigns: 1
      };

      await User.updateOne(
        { _id: admin._id },
        { $unset: fieldsToUnset }
      );

      console.log('Successfully removed extra fields from admin user.');
    } else {
      console.log('Admin user not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

cleanAdminUser();
