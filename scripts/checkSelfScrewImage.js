require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected\n');

    const product = await Product.findOne({ name: /SELF SCREW WHITE/i });
    if (product) {
      console.log('Product:', product.name);
      console.log('Images:', product.images);
      console.log('\nImage URL:', product.images[0]);
    } else {
      console.log('Product not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

check();
