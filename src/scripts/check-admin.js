const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ridedeck';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' });
    console.log('Admins found:', admins.length);
    admins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.phone})`);
    });

    if (admins.length === 0) {
      console.log('No admins found. Promoting the first user to admin for testing...');
      const firstUser = await User.findOne();
      if (firstUser) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(firstUser.phone, salt);
        
        await User.findByIdAndUpdate(firstUser._id, { 
          role: 'admin',
          password: hashedPassword
        });
        console.log(`Promoted ${firstUser.name} (${firstUser.phone}) to admin and reset password to his phone number.`);
      } else {
        console.log('No users found in database.');
      }
    } else {

      const mohit = await User.findOne({ phone: '09756812554' });
      if (mohit) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(mohit.phone, salt);
        await User.findByIdAndUpdate(mohit._id, { password: hashedPassword });
        console.log(`Updated password for ${mohit.name} to his phone number.`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmin();
