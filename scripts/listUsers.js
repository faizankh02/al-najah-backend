require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function list() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');
    const users = await User.find().select('email role createdAt');
    console.log('Users:');
    users.forEach(u => console.log(`${u.email} - ${u.role} - ${u.createdAt}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();