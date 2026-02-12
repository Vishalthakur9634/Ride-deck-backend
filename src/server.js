const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Dynamic CORS configuration for localhost and production (Netlify)
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"]
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting removed for development

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

connectDB(process.env.MONGO_URI);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User ${userId} joined their room: ${userId}`);
    }
  });

  socket.on('driver-online', (driverId) => {
    socket.join('drivers');
    console.log(`Driver ${driverId} joined drivers room`);
  });

  socket.on('join-admin', () => {
    socket.join('admins');
    console.log(`Admin ${socket.id} joined admins room`);
  });

  socket.on('update-location', async ({ rideId, location, driverId }) => {
    if (driverId) {
      try {
        await User.findByIdAndUpdate(driverId, {
          currentLocation: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          }
        });
      } catch (error) {
        console.error('Failed to update driver location in DB:', error.message);
      }
    }

    if (rideId) {
      io.to(rideId).emit('location-update', { location, driverId });
    }

    io.to('admins').emit('admin-location-update', { rideId, location, driverId });
  });

  socket.on('driver-arrived', ({ rideId, riderId }) => {
    console.log(`Driver arrived for ride ${rideId}`);
    io.to(riderId).emit('driver-arrived', { rideId });
  });

  socket.on('ride-status-update', ({ rideId, riderId, status, ride }) => {
    console.log(`Ride ${rideId} status updated to ${status}`);
    io.to(riderId).emit('rideStatusUpdate', ride);
  });

  socket.on('ride-completed', ({ rideId, riderId, ride }) => {
    console.log(`Ride ${rideId} completed`);
    io.to(riderId).emit('ride-completed', ride);
  });

  socket.on('send-message', ({ to, message, senderName }) => {
    if (to) {
      io.to(to.toString()).emit('receive-message', {
        from: socket.id,
        message,
        senderName,
        timestamp: new Date()
      });
      console.log(`Message from ${senderName} to ${to}: ${message}`);
    }
  });

  socket.on('sos-alert', ({ userId, userName, location, rideId }) => {
    console.error(`🚨 SOS ALERT from ${userName} (ID: ${userId}) on ride ${rideId} at ${JSON.stringify(location)}`);
    io.to('admins').emit('admin-sos-alert', { userId, userName, location, rideId, timestamp: new Date() });
  });

  socket.on('share-trip', ({ rideId, riderName, location, destination }) => {
    console.log(`Trip shared by ${riderName} for ride ${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.set('io', io);

const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/driver');
const rideRoutes = require('./routes/rides');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const growthRoutes = require('./routes/growth');
const brandRoutes = require('./routes/brand');
const walletRoutes = require('./routes/wallet');
const couponRoutes = require('./routes/coupons');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Ride Deck API is running...');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Auto-start bot simulator for development/testing
  if (process.env.NODE_ENV !== 'production') {
    const { spawn } = require('child_process');
    const botProcess = spawn('node', ['src/scripts/bot-simulator.js'], {
      cwd: __dirname + '/..',
      stdio: 'inherit'
    });

    botProcess.on('error', (err) => {
      console.error('❌ Failed to start bot simulator:', err.message);
    });

    console.log('🤖 Bot simulator auto-started');
  }
});
