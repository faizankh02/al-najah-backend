require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function clearAndReseed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');
    
    // Clear all existing categories
    console.log('Clearing existing categories...');
    await Category.deleteMany({});
    console.log('All categories deleted.');

    // Run the seed script
    console.log('Running seed script...');
    const { execSync } = require('child_process');
    execSync('node scripts/seedCategories.js', { stdio: 'inherit' });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

clearAndReseed();