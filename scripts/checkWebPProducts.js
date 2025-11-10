require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function checkWebPProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const products = await Product.find({ 
      images: { $regex: /\.webp/i } 
    });
    
    console.log(`Found ${products.length} products with WebP images:\n`);
    
    products.forEach(p => {
      console.log(`Product: ${p.name}`);
      console.log(`Image: ${p.images[0]}`);
      console.log('---');
    });
    
    if (products.length === 0) {
      console.log('No products with WebP images found in database.');
      console.log('\nLet\'s check products with image URLs containing "webp":');
      const allProducts = await Product.find({ images: { $exists: true, $ne: [] } });
      allProducts.forEach(p => {
        if (p.images && p.images.length > 0 && p.images[0]) {
          const url = p.images[0].toLowerCase();
          if (url.includes('webp')) {
            console.log(`  ${p.name}: ${p.images[0]}`);
          }
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWebPProducts();
