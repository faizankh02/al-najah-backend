require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function create() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');

    const existing = await Product.findOne({ name: 'Sample Product' });
    if (existing) {
      console.log('Sample Product already exists with id:', existing._id);
      process.exit(0);
    }

    const prod = new Product({
      name: 'Sample Product',
      slug: 'sample-product',
      category: new mongoose.Types.ObjectId('690ce645a35636169fd1b1ef'),
      description: 'This is a sample product for testing that belongs to Sample Category.',
      images: ['https://placehold.co/600x400'],
      specs: { color: 'grey', weight: '1.2kg' },
      price: 99.99
    });

    const saved = await prod.save();
    console.log('Created product:', saved);
    process.exit(0);
  } catch (err) {
    console.error('Error creating product', err);
    process.exit(1);
  }
}

create();