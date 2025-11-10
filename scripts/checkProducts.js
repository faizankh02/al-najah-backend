require('dotenv').config();
const Product = require('../models/Product');
const Category = require('../models/Category');
const connectDB = require('../config/db');

connectDB();

setTimeout(async () => {
  try {
    const products = await Product.find().populate('category').limit(20);
    console.log(`\nTotal products in database: ${await Product.countDocuments()}\n`);
    
    if (products.length > 0) {
      console.log('Recent products:');
      products.forEach(p => {
        console.log(`  - ${p.name}`);
        console.log(`    Category: ${p.category ? p.category.name : 'No category'}`);
        console.log(`    Images: ${p.images ? p.images.length : 0}`);
      });
    } else {
      console.log('No products found in database.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}, 2000);
