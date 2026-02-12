const axios = require('axios');
const io = require('socket.io-client');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:5001';
const SOCKET_URL = API_URL;

// Bot Personas
const BOT_RIDER = { phone: '9999999999', password: 'password123' };
const BOT_DRIVER = { phone: '8888888888', password: 'password123' };

let riderId = '';
let driverId = '';
let riderToken = '';
let driverToken = '';
let riderSocket, driverSocket;

const User = require('../models/User');
const Ride = require('../models/Ride');

async function login() {
    try {
        const rRes = await axios.post(`${API_URL}/api/auth/login`, BOT_RIDER);
        riderToken = rRes.data.token;
        riderId = rRes.data._id;
        console.log('✅ Bot Rider Logged In, ID:', riderId);

        const dRes = await axios.post(`${API_URL}/api/auth/login`, BOT_DRIVER);
        driverToken = dRes.data.token;
        driverId = dRes.data._id;
        console.log('✅ Bot Driver Logged In, ID:', driverId);
    } catch (e) {
        console.error('❌ Login failed. Make sure to run seed-drivers.js first.');
        process.exit(1);
    }
}

async function setupRider() {
    riderSocket = io(SOCKET_URL, { auth: { token: riderToken } });
    riderSocket.on('connect', () => {
        console.log('🤖 Bot Rider Socket Connected');
        riderSocket.emit('join', riderId);
    });
}

async function setupDriver() {
    driverSocket = io(SOCKET_URL, { auth: { token: driverToken } });
    driverSocket.on('connect', () => {
        console.log('🤖 Bot Driver Socket Connected');
        driverSocket.emit('join', driverId);
        driverSocket.emit('driver-online', driverId);
    });

    driverSocket.on('newRideRequest', async (ride) => {
        console.log(`🚕 Bot Driver received request for ₹${ride.fare}. Sending Offer...`);
        try {
            await axios.post(`${API_URL}/api/rides/offer`, {
                rideId: ride._id,
                amount: ride.fare + 10, // Offer slightly more for variety
                eta: 5
            }, { headers: { Authorization: `Bearer ${driverToken}` } });
            console.log('✅ Bot Driver Offer Sent');
        } catch (e) {
            console.error('❌ Bot Driver offer failed', e.response?.data || e.message);
        }
    });
}

// NEW: Watch for ANY searching rides to trigger BOT_DRIVER reactivity (Global Bot)
async function watchRides() {
    console.log('👀 Watching for Searching Rides to trigger Bot Driver reactivity...');

    setInterval(async () => {
        try {
            const searchingRides = await Ride.find({ status: 'searching' }).sort({ createdAt: -1 });

            if (searchingRides.length > 0) {
                console.log(`🔍 Found ${searchingRides.length} searching ride(s)`);
                const latestRide = searchingRides[0];

                // If it's a real rider's request (not from our bot rider)
                const botRider = await User.findOne({ phone: BOT_RIDER.phone });
                if (latestRide.riderId.toString() !== botRider._id.toString()) {

                    const pickupCoords = latestRide.pickup.coordinates; // [lng, lat]

                    // 1. Move Bot Driver to the pickup location so it's "nearby"
                    await User.findByIdAndUpdate(driverId, {
                        currentLocation: {
                            type: 'Point',
                            coordinates: pickupCoords
                        }
                    });

                    // 2. Also emit a location update via socket so the backend/rider sees us
                    driverSocket.emit('update-location', {
                        driverId,
                        location: { lng: pickupCoords[0], lat: pickupCoords[1] }
                    });

                    console.log(`📍 Bot Driver teleported to pickup: ${latestRide.pickup.address}`);

                    // 3. The backend logic in rides.js should now pick up this driver 
                    // and emit 'newRideRequest' to it.
                    // But just in case, let's also trigger an offer if it hasn't been sent.
                    const alreadyOffered = latestRide.offers.some(o => o.driverId.toString() === driverId.toString());
                    if (!alreadyOffered) {
                        console.log(`🚕 Bot Driver sending reactive offer for ride ${latestRide._id}`);
                        await axios.post(`${API_URL}/api/rides/offer`, {
                            rideId: latestRide._id,
                            amount: latestRide.fare + 5,
                            eta: 3
                        }, { headers: { Authorization: `Bearer ${driverToken}` } });
                        console.log('✅ Offer sent successfully!');
                    } else {
                        console.log('⏭️  Already offered on this ride, skipping...');
                    }
                } else {
                    console.log('🤖 Found ride from bot rider, skipping...');
                }
            }
        } catch (e) {
            console.error('❌ Error in ride watch:', e.message);
        }
    }, 5000); // Check every 5 seconds for faster response
}

// Watch for REAL drivers going online to trigger BOT_RIDER bookings
async function watchDrivers() {
    console.log('👀 Watching for Online Drivers to trigger Bot Rider requests...');

    // Poll every 10 seconds (simplest way without changing backend logic)
    setInterval(async () => {
        try {
            // Find real drivers who are online (excluding bots)
            const onlineDrivers = await User.find({
                role: 'driver',
                isOnline: true,
                phone: { $nin: [BOT_DRIVER.phone, '1112223333', '1112223334', '1112223335', '1112223336'] }
            });

            if (onlineDrivers.length > 0) {
                // Check if Bot Rider already has an active ride
                const botUser = await User.findOne({ phone: BOT_RIDER.phone });
                const activeRide = await Ride.findOne({
                    riderId: botUser._id,
                    status: { $in: ['searching', 'booked', 'arrived', 'started'] }
                });

                if (!activeRide) {
                    const driver = onlineDrivers[0];
                    console.log(`🎯 Real Driver ${driver.name} is online! Bot Rider sending booking request...`);

                    await axios.post(`${API_URL}/api/rides/book`, {
                        pickup: 'Mathura Junction',
                        dropoff: 'Krishna Janmabhoomi',
                        vehicleType: 'cab',
                        fare: 150,
                        pickupCoords: { lat: 27.4924, lng: 77.6736 },
                        dropoffCoords: { lat: 27.5000, lng: 77.6800 },
                        paymentMethod: 'cash'
                    }, { headers: { Authorization: `Bearer ${riderToken}` } });

                    console.log('🚀 Bot Rider Request Sent to User!');
                }
            }
        } catch (e) {
            // console.error('Error in driver watch', e.message);
        }
    }, 10000);
}

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Bot MongoDB Connected');
    } catch (err) {
        // Silently retry
        setTimeout(start, 10000);
        return;
    }

    await login();
    await setupRider();
    await setupDriver();
    await watchRides();
    await watchDrivers();
}

start();
