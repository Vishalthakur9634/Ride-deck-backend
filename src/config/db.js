const mongoose = require('mongoose')

async function connectDB(uri) {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(uri, options);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    // Silently retry in background - don't spam console
    setTimeout(() => connectDB(uri), 10000);
  }
}

module.exports = connectDB;
