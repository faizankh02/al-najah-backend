require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/al-najah-connect')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function bulkImportProductsWithImages() {
  try {
    // Read the Excel file
    const excelPath = path.join(__dirname, '../data/products.xlsx');
    console.log('Reading Excel file from:', excelPath);
    
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} products in Excel file\n`);

    // Fetch all categories for mapping
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat._id;
      categoryMap[cat.slug.toLowerCase()] = cat._id;
    });

    console.log('Available categories:', categories.map(c => c.name).join(', '));
    console.log('\n--- Starting Import ---\n');

    // Ask user where their images are located
    const imagesSourceFolder = process.argv[2] || path.join(__dirname, '../data/images');
    const imagesDestFolder = path.join(__dirname, '../../public/uploads/products');

    console.log('📁 Images source folder:', imagesSourceFolder);
    console.log('📁 Images destination:', imagesDestFolder);
    console.log('');

    // Create destination folder if it doesn't exist
    if (!fs.existsSync(imagesDestFolder)) {
      fs.mkdirSync(imagesDestFolder, { recursive: true });
      console.log('✓ Created uploads folder\n');
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let imagesCopied = 0;

    for (const row of data) {
      try {
        // Get data from Excel
        const productName = row.Name || row.name || row.PRODUCT_NAME;
        const categoryName = row.Category || row.category || row.CATEGORY;
        const description = row.Description || row.description || '';
        const price = row.Price || row.price || row.PRICE || 0;
        const imageFileName = row.Image || row.image || row.IMAGE || '';
        
        // Support both ImagePath column and auto-detect
        const imageFullPath = row.ImagePath || row.imagePath || row.IMAGE_PATH || 
                             (imageFileName ? path.join(imagesSourceFolder, imageFileName) : '');
        
        const specs = row.Specs || row.specs || row.SPECS || '';

        if (!productName) {
          console.warn('⊘ Skipping row: missing product name');
          skipCount++;
          continue;
        }

        if (!categoryName) {
          console.warn(`⊘ Skipping "${productName}": missing category`);
          skipCount++;
          continue;
        }

        // Find category ID
        const categoryId = categoryMap[categoryName.toLowerCase()];
        if (!categoryId) {
          console.warn(`⊘ Skipping "${productName}": category "${categoryName}" not found`);
          skipCount++;
          continue;
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          name: productName,
          category: categoryId 
        });

        if (existingProduct) {
          console.log(`⊘ "${productName}" already exists, skipping`);
          skipCount++;
          continue;
        }

        // Generate slug
        let slug = productName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
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
              if (key && value) {
                parsedSpecs[key] = value;
              }
            });
          }
        }

        // Handle image - COPY from source to destination
        let images = [];
        if (imageFullPath && fs.existsSync(imageFullPath)) {
          const destFileName = path.basename(imageFullPath);
          const destPath = path.join(imagesDestFolder, destFileName);
          
          // Copy image file
          fs.copyFileSync(imageFullPath, destPath);
          images = [`/uploads/products/${destFileName}`];
          imagesCopied++;
          console.log(`  📷 Copied: ${destFileName}`);
        } else if (imageFileName) {
          // Check if file already exists in destination
          const destPath = path.join(imagesDestFolder, imageFileName);
          if (fs.existsSync(destPath)) {
            images = [`/uploads/products/${imageFileName}`];
            console.log(`  📷 Using existing: ${imageFileName}`);
          } else {
            console.log(`  ⚠️  Image not found: ${imageFullPath || imageFileName}`);
          }
        }

        // Create product
        const product = new Product({
          name: productName,
          slug: uniqueSlug,
          category: categoryId,
          description: description || `Quality ${productName} available at Al-Najah Connect`,
          images: images,
          specs: parsedSpecs,
          price: parseFloat(price) || 0
        });

        await product.save();
        console.log(`✓ Created: ${productName} (${categoryName})`);
        successCount++;

      } catch (error) {
        console.error(`✗ Error with product "${row.Name || 'unknown'}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IMPORT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ Successfully imported: ${successCount} products`);
    console.log(`📷 Images copied: ${imagesCopied} files`);
    console.log(`⊘ Skipped (duplicates/missing data): ${skipCount} products`);
    console.log(`✗ Errors: ${errorCount} products`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Bulk import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Show usage help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node bulkImportProductsWithImages.js [images-folder-path]

Examples:
  node bulkImportProductsWithImages.js
  node bulkImportProductsWithImages.js "C:/Users/asus/Desktop/product-images"
  node bulkImportProductsWithImages.js "D:/My Products/Photos"

Excel Format Options:

Option 1: Use "ImagePath" column with full paths
  Name         | Category    | ImagePath
  Hammer 500g  | Hand Tools  | C:/Users/asus/Desktop/images/hammer.jpg
  Paint White  | Painting    | C:/Users/asus/Desktop/images/paint.jpg

Option 2: Use "Image" column with folder parameter
  Name         | Category    | Image
  Hammer 500g  | Hand Tools  | hammer.jpg
  Paint White  | Painting    | paint.jpg
  
  Then run: node bulkImportProductsWithImages.js "C:/Users/asus/Desktop/images"

The script will automatically copy images to public/uploads/products/

Notes:
- If no path provided, looks in backend/data/images/ by default
- Images are copied (not moved), originals stay safe
- Duplicate products are skipped automatically
`);
  process.exit(0);
}

bulkImportProductsWithImages();
