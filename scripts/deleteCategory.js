require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

async function deleteCategory() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');

    const deleted = await Category.findOneAndDelete({ name: 'Sample Category' });
    
    if (deleted) {
      console.log('Successfully deleted Sample Category');
    } else {
      console.log('Sample Category not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error deleting category:', err);
    process.exit(1);
  }
}

deleteCategory();