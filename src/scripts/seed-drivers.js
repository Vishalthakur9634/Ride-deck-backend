const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const seedDrivers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing test drivers if you want, but better to just add
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Delhi Coordinates: [77.2090, 28.6139]
        // Seed 6 drivers in various locations
        const drivers = [
            {
                name: 'Mathura Cab',
                phone: '1112223333',
                password: hashedPassword,
                role: 'driver',
                isVerified: true,
                kycStatus: 'verified',
                subscriptionStatus: 'active',
                subscriptionType: 'monthly',
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isOnline: true,
                vehicleType: 'cab',
                vehicleNumber: 'UP 85 MT 1234',
                currentLocation: {
                    type: 'Point',
                    coordinates: [77.6736, 27.4924]
                },
                walletBalance: 500,
                referralCode: 'MATH01'
            },
            {
                name: 'Chaumuhan Bike',
                phone: '1112223334',
                password: hashedPassword,
                role: 'driver',
                isVerified: true,
                kycStatus: 'verified',
                subscriptionStatus: 'active',
                subscriptionType: 'daily',
                subscriptionExpiry: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                isOnline: true,
                vehicleType: 'bike',
                vehicleNumber: 'UP 85 CH 5678',
                currentLocation: {
                    type: 'Point',
                    coordinates: [77.5838, 27.6400]
                },
                walletBalance: 200,
                referralCode: 'CHAU01'
            },
            {
                name: 'Govardhan Auto',
                phone: '1112223335',
                password: hashedPassword,
                role: 'driver',
                isVerified: true,
                kycStatus: 'verified',
                subscriptionStatus: 'active',
                subscriptionType: 'weekly',
                subscriptionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                isOnline: true,
                vehicleType: 'auto',
                vehicleNumber: 'UP 85 GV 9012',
                currentLocation: {
                    type: 'Point',
                    coordinates: [77.4626, 27.4965]
                },
                walletBalance: 300,
                referralCode: 'GOV01'
            },
            {
                name: 'Mathura Rider Support',
                phone: '1112223336',
                password: hashedPassword,
                role: 'driver',
                isVerified: true,
                kycStatus: 'verified',
                subscriptionStatus: 'active',
                subscriptionType: 'monthly',
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isOnline: true,
                vehicleType: 'cab',
                currentLocation: {
                    type: 'Point',
                    coordinates: [77.6800, 27.5000]
                }
            },
            {
                name: 'Simulator Driver (Bot)',
                phone: '8888888888',
                password: hashedPassword,
                role: 'driver',
                isVerified: true,
                kycStatus: 'verified',
                subscriptionStatus: 'active',
                subscriptionType: 'monthly',
                subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                isOnline: true,
                vehicleType: 'cab',
                vehicleNumber: 'UP 85 BOT 007',
                currentLocation: {
                    type: 'Point',
                    coordinates: [77.6736, 27.4924]
                },
                walletBalance: 1000,
                rating: 5.0
            },
            {
                name: 'Simulator Rider (Bot)',
                phone: '9999999999',
                password: hashedPassword,
                role: 'rider',
                isVerified: true,
                walletBalance: 1000,
                rating: 5.0
            }
        ];

        // Seeding completed successfully
        for (const driver of drivers) {
            const existing = await User.findOne({ phone: driver.phone });
            if (existing) {
                await User.findByIdAndUpdate(existing._id, driver);
                console.log(`Updated user: ${driver.name}`);
            } else {
                await User.create(driver);
                console.log(`Created user: ${driver.name}`);
            }
        }

        for (const driver of drivers) {
            const existing = await User.findOne({ phone: driver.phone });
            if (existing) {
                await User.findByIdAndUpdate(existing._id, driver);
                console.log(`Updated user: ${driver.name}`);
            } else {
                await User.create(driver);
                console.log(`Created user: ${driver.name}`);
            }
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding drivers:', error);
        process.exit(1);
    }
};

seedDrivers();
