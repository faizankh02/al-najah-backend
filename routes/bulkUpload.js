const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Configure multer for file uploads (Excel + Images)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'excel') {
      cb(null, path.join(__dirname, '../data'));
    } else if (file.fieldname === 'images') {
      // Save to backend/public/uploads/products (same as regular uploads)
      const uploadsDir = path.join(__dirname, '../public/uploads/products');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    }
  },
  filename: function (req, file, cb) {
    if (file.fieldname === 'excel') {
      cb(null, 'products-upload.xlsx');
    } else {
      // Keep original filename for images
      cb(null, file.originalname);
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// POST /api/bulk-upload - Upload Excel + Images and import products
router.post('/', auth, upload.fields([
  { name: 'excel', maxCount: 1 },
  { name: 'images', maxCount: 100 }
]), async (req, res) => {
  try {
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!req.files || !req.files.excel) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    const excelFile = req.files.excel[0];
    const uploadedImages = req.files.images || [];

    console.log('Processing bulk upload...');
    console.log('Excel file:', excelFile.filename);
    console.log('Images uploaded:', uploadedImages.length);
    
    // Log image details for debugging
    if (uploadedImages.length > 0) {
      console.log('Image files received:');
      uploadedImages.forEach(img => {
        console.log(`  - Original: ${img.originalname} -> Saved as: ${img.filename} at ${img.path}`);
      });
    }

    // Read Excel file
    const workbook = xlsx.readFile(excelFile.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Build category map with normalization (so Excel variations match)
    const categories = await Category.find();
    const categoryMap = {};
    const normalizeCategory = (name) => {
      return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    categories.forEach(cat => {
      const lower = cat.name.toLowerCase();
      const norm = normalizeCategory(cat.name);
      categoryMap[lower] = cat._id;
      categoryMap[norm] = cat._id;
      categoryMap[cat.slug] = cat._id;
      categoryMap[lower.replace(/&/g,'and')] = cat._id;
      categoryMap[lower.replace(/and/g,'&')] = cat._id;
    });
    console.log('Total categories loaded:', categories.length);

    // Image filename normalization and map
    const imageMap = {};
    const normalizeFileName = (name) => {
      if (!name) return '';
      const base = name.toString().split(/[\\\/]/).pop();
      const lower = base.toLowerCase().trim();
      const noExt = lower.replace(/\.(jpg|jpeg|png|webp|gif)$/i,'');
      const spaces = noExt.replace(/[\s_\-]+/g,' ').trim();
      const alnum = spaces.replace(/[^a-z0-9 ]/g,'').trim();
      const compact = alnum.replace(/\s+/g,'');
      const slug = alnum.replace(/\s+/g,'-');
      return {lower,noExt,spaces,alnum,compact,slug};
    };
    const addToImageMap = (key, filename) => { if (key && !imageMap[key]) imageMap[key]=filename; };
    uploadedImages.forEach(img => {
      const fname = img.filename; const orig = img.originalname || fname; const norm = normalizeFileName(orig);
      addToImageMap(orig.toLowerCase(), fname);
      addToImageMap(norm.lower, fname);
      addToImageMap(norm.noExt, fname);
      addToImageMap(norm.spaces, fname);
      addToImageMap(norm.alnum, fname);
      addToImageMap(norm.compact, fname);
      addToImageMap(norm.slug, fname);
    });

    let successCount = 0;
    let updatedCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const productName = row.Name || row.name || row.PRODUCT_NAME;
        const categoryName = row.Category || row.category || row.CATEGORY;
        const description = row.Description || row.description || '';
        const price = row.Price || row.price || row.PRICE || 0;
        const imageFileName = row.Image || row.image || row.IMAGE || '';
        const specs = row.Specs || row.specs || row.SPECS || '';

        if (!productName || !categoryName) {
          skipCount++;
          continue;
        }

        // Try multiple category matching strategies
        let categoryId = categoryMap[categoryName.toLowerCase()];
        
        // If not found, try normalized version
        if (!categoryId) {
          const normalized = normalizeCategory(categoryName);
          categoryId = categoryMap[normalized];
        }
        
        // If still not found, try replacing & with "and"
        if (!categoryId) {
          categoryId = categoryMap[categoryName.toLowerCase().replace(/&/g, 'and')];
        }
        
        // If still not found, try replacing "and" with &
        if (!categoryId) {
          categoryId = categoryMap[categoryName.toLowerCase().replace(/and/g, '&')];
        }
        
        if (!categoryId) {
          errors.push(`Category "${categoryName}" not found for product "${productName}"`);
          skipCount++;
          continue;
        }

        // Check for existing product
        let existing = await Product.findOne({ name: productName, category: categoryId });

        // Generate slug
        let slug = productName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        let uniqueSlug = slug;
        let counter = 1;
        while (await Product.findOne({ slug: uniqueSlug })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        // Parse specs
        let parsedSpecs = {};
        if (specs) {
          try {
            parsedSpecs = JSON.parse(specs);
          } catch (e) {
            const specPairs = specs.split(',');
            specPairs.forEach(pair => {
              const [key, value] = pair.split(':').map(s => s.trim());
              if (key && value) parsedSpecs[key] = value;
            });
          }
        }

        // Find uploaded image using multiple fallbacks
        const resolveImage = (raw) => {
          if (!raw) return '';
          const norm = normalizeFileName(raw);
          const candidates = [
            raw.toLowerCase(),
            norm.lower, norm.noExt, norm.spaces, norm.alnum, norm.compact, norm.slug
          ];
          if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(raw)) {
            ['.jpg','.jpeg','.png','.webp','.gif'].forEach(ext => candidates.push((norm.noExt+ext).toLowerCase()));
          }
          for (const c of candidates) { if (imageMap[c]) return imageMap[c]; }
          return '';
        };
        let images = [];
        const matched = resolveImage(imageFileName);
        if (matched) {
          images = [`/uploads/products/${matched}`];
          console.log(`✓ Matched image for "${productName}": ${imageFileName} -> ${matched}`);
        } else if (imageFileName) {
          // Log a helpful unmatched image notice (non-fatal)
          console.log(`✗ Image not found for "${productName}": ${imageFileName}`);
          errors.push(`Image "${imageFileName}" not found for product "${productName}"`);
        }

        // Update existing product rather than skip
        if (existing) {
          if (images.length && (!Array.isArray(existing.images) || !existing.images.includes(images[0]))) {
            existing.images = images;
            if (description) existing.description = description;
            if (price) existing.price = parseFloat(price) || 0;
            existing.specs = parsedSpecs;
            await existing.save();
            updatedCount++;
            continue;
          } else {
            skipCount++; // nothing new to update
            continue;
          }
        }

        // Create product
        const product = new Product({
          name: productName,
          slug: uniqueSlug,
          category: categoryId,
          description: description || `Quality ${productName}`,
          images: images,
          specs: parsedSpecs,
          price: parseFloat(price) || 0
        });

        await product.save();
        successCount++;

      } catch (error) {
        errorCount++;
        errors.push(`Error with "${row.Name}": ${error.message}`);
      }
    }

    res.json({
      success: true,
      summary: {
        total: data.length,
        imported: successCount,
        updated: updatedCount,
        skipped: skipCount,
        errors: errorCount
      },
      imagesUploaded: uploadedImages.length,
      errors: errors
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Bulk upload failed', error: error.message });
  }
});

module.exports = router;
