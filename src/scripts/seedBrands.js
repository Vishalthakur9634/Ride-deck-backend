const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Brand = require('../models/Brand');
const Campaign = require('../models/Campaign');

dotenv.config();

const seedBrands = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');


    await Brand.deleteMany({});
    await Campaign.deleteMany({});
    console.log('Cleared existing brands and campaigns');

    const brands = await Brand.insertMany([
      {
        name: 'Starbucks',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png',
        category: 'Food & Beverage',
        description: 'Premium coffee and snacks'
      },
      {
        name: 'McDonalds',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png',
        category: 'Food & Beverage',
        description: 'Burgers, fries, and more'
      },
      {
        name: 'H&M',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/1200px-H%26M-Logo.svg.png',
        category: 'Retail',
        description: 'Fashion and clothing'
      }
    ]);

    console.log(`Seeded ${brands.length} brands`);

    const campaigns = await Campaign.insertMany([
      {
        brandId: brands[0]._id, 
        title: '20% off Cold Coffee',
        description: 'Beat the heat with our signature brew.',
        code: 'RIDE20',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        },
        radius: 1000,
        activeHours: { start: 0, end: 2359 },
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      {
        brandId: brands[1]._id,
        title: 'Free McFlurry',
        description: 'Get a free McFlurry with any meal.',
        code: 'MCFREE',
        location: {
          type: 'Point',
          coordinates: [77.0878, 28.5039]
        },
        radius: 1000,
        activeHours: { start: 1000, end: 2200 },
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      {
        brandId: brands[2]._id,
        title: 'Flat 15% Off',
        description: 'Show this coupon at checkout.',
        code: 'STYLE15',
        location: {
          type: 'Point',
          coordinates: [77.2197, 28.5273]
        },
        radius: 1000,
        activeHours: { start: 1000, end: 2200 },
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }
    ]);

    console.log(`Seeded ${campaigns.length} campaigns`);
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedBrands();
