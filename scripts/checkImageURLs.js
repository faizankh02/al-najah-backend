require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function checkImageURLs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');
    console.log('MongoDB connected\n');

    const products = await Product.find({ images: { $exists: true, $ne: [] } }).limit(5);
    
    console.log('Products with images:\n');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Images: ${JSON.stringify(product.images)}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImageURLs();
