require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory using absolute path
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const inquiriesRoutes = require('./routes/inquiries');
const uploadsRoutes = require('./routes/uploads');
const searchRoutes = require('./routes/search');
const bulkUploadRoutes = require('./routes/bulkUpload');

app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);

app.get('/', (req, res) => res.send('Al Najah API running'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
