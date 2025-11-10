require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function create() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');

    const existing = await Category.findOne({ name: 'Sample Category' });
    if (existing) {
      console.log('Sample Category already exists with id:', existing._id);
      process.exit(0);
    }

    const cat = new Category({
      name: 'Sample Category',
      slug: 'sample-category',
      description: 'This is a sample category created by a script for testing.',
      imageUrl: 'https://placehold.co/600x400'
    });

    const saved = await cat.save();
    console.log('Created category:', saved);
    process.exit(0);
  } catch (err) {
    console.error('Error creating category', err);
    process.exit(1);
  }
}

create();