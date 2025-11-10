require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function create() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');

    const existing = await Category.findOne({ name: 'Fasteners' });
    if (existing) {
      console.log('Fasteners category already exists with id:', existing._id);
      process.exit(0);
    }

    const cat = new Category({
      name: 'Fasteners',
      slug: 'fasteners',
      description: 'All types of fasteners including nails, screws, bolts, and anchors',
      imageUrl: '/uploads/products/1762706554806-149723163.jpg'
    });

    const saved = await cat.save();
    console.log('Created Fasteners category:', saved);
    process.exit(0);
  } catch (err) {
    console.error('Error creating category', err);
    process.exit(1);
  }
}

create();
