require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const CATEGORY_ID = '690ce645a35636169fd1b1ef';
const PRODUCTS = [
  { name: 'Concrete Mixer', slug: 'concrete-mixer', price: 499.99 },
  { name: 'Steel Rebar 12mm', slug: 'steel-rebar-12mm', price: 12.5 },
  { name: 'Cement Bag 50kg', slug: 'cement-bag-50kg', price: 7.99 },
  { name: 'Brick Pallet', slug: 'brick-pallet', price: 250.0 },
  { name: 'Trowel Set', slug: 'trowel-set', price: 19.99 },
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');

    for (const p of PRODUCTS) {
      const exists = await Product.findOne({ slug: p.slug });
      if (exists) {
        console.log('Skipping existing product:', p.slug);
        continue;
      }

      const prod = new Product({
        name: p.name,
        slug: p.slug,
        category: new mongoose.Types.ObjectId(CATEGORY_ID),
        description: `${p.name} - sample product created for testing.`,
        images: ['https://placehold.co/600x400'],
        specs: { origin: 'test', unit: 'pcs' },
        price: p.price,
      });

      const saved = await prod.save();
      console.log('Created product:', saved.slug, saved._id.toString());
    }

    console.log('Done creating products');
    process.exit(0);
  } catch (err) {
    console.error('Error creating products', err);
    process.exit(1);
  }
}

run();
