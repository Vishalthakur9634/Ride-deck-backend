const mongoose = require('mongoose')

async function connectDB(uri) {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  console.log('🔄 Attempting MongoDB connection...');
  console.log('Connection string:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password

  try {
    await mongoose.connect(uri, options);
    console.log("✅ MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("Error code:", err.code);
    // Silently retry in background - don't spam console
    setTimeout(() => connectDB(uri), 10000);
  }

  // Monitor connection state
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });
}

module.exports = connectDB;
