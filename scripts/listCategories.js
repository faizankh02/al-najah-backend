require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function list() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');
    const categories = await Category.find().lean();
    console.log(JSON.stringify(categories, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();