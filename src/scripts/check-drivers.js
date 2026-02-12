const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const checkDrivers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const totalDrivers = await User.countDocuments({ role: 'driver' });
        const onlineDrivers = await User.find({ role: 'driver', isOnline: true });

        console.log(`Total Drivers: ${totalDrivers}`);
        console.log(`Online Drivers: ${onlineDrivers.length}`);

        onlineDrivers.forEach(d => {
            console.log(`- ${d.name} (${d.phone}) | KYC: ${d.kycStatus} | Subs: ${d.subscriptionStatus} | Location: ${JSON.stringify(d.currentLocation.coordinates)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkDrivers();
