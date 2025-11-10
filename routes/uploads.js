const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for local file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // __dirname is backend/routes/, so go up one level to backend/, then to public/uploads/products/
    const uploadDir = path.join(__dirname, '../public/uploads/products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Check file extension
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // Check mime type - WebP uses 'image/webp'
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const mimetype = allowedMimeTypes.includes(file.mimetype.toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
    }
  }
});

// Upload image endpoint
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/products/${req.file.filename}`;
    console.log('File uploaded successfully:', req.file.filename, 'at path:', req.file.path);
    res.json({ 
      fileName: req.file.filename,
      fileUrl: fileUrl,
      uploadURL: fileUrl // For compatibility with S3 response
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
    }
    return res.status(400).json({ message: error.message });
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

// Keep the presigned URL endpoint for backward compatibility
router.post('/presigned-url', auth, async (req, res) => {
  try {
    // For local development, return a mock response
    const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    res.json({ 
      uploadURL: `/uploads/${fileName}`,
      fileName: fileName
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
