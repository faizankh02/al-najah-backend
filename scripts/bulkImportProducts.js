require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/al-najah-connect')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function bulkImportProducts() {
  try {
    // Read the Excel file
    const excelPath = path.join(__dirname, '../data/products.xlsx');
    console.log('Reading Excel file from:', excelPath);
    
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} products in Excel file`);

    // Fetch all categories for mapping
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat._id;
      categoryMap[cat.slug.toLowerCase()] = cat._id;
    });

    console.log('Available categories:', categories.map(c => c.name).join(', '));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        // Expected Excel columns: Name, Category, Description, Price, Image, Specs (JSON or key:value pairs)
        const productName = row.Name || row.name || row.PRODUCT_NAME;
        const categoryName = row.Category || row.category || row.CATEGORY;
        const description = row.Description || row.description || '';
        const price = row.Price || row.price || row.PRICE || 0;
        const imageFileName = row.Image || row.image || row.IMAGE || '';
        const specs = row.Specs || row.specs || row.SPECS || '';

        if (!productName) {
          console.warn('Skipping row: missing product name');
          skipCount++;
          continue;
        }

        if (!categoryName) {
          console.warn(`Skipping product "${productName}": missing category`);
          skipCount++;
          continue;
        }

        // Find category ID
        const categoryId = categoryMap[categoryName.toLowerCase()];
        if (!categoryId) {
          console.warn(`Skipping product "${productName}": category "${categoryName}" not found`);
          skipCount++;
          continue;
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          name: productName,
          category: categoryId 
        });

        if (existingProduct) {
          console.log(`⊘ Product "${productName}" already exists, skipping`);
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

        // Ensure unique slug
        let uniqueSlug = slug;
        let counter = 1;
        while (await Product.findOne({ slug: uniqueSlug })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        // Parse specs (handle JSON or key:value format)
        let parsedSpecs = {};
        if (specs) {
          try {
            // Try parsing as JSON first
            parsedSpecs = JSON.parse(specs);
          } catch (e) {
            // If not JSON, try parsing as key:value pairs (e.g., "Material: Steel, Weight: 2kg")
            const specPairs = specs.split(',');
            specPairs.forEach(pair => {
              const [key, value] = pair.split(':').map(s => s.trim());
              if (key && value) {
                parsedSpecs[key] = value;
              }
            });
          }
        }

        // Build image URL (assuming images are in /uploads/products/)
        const images = imageFileName 
          ? [`/uploads/products/${imageFileName}`] 
          : [];

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
        console.log(`✓ Created product: ${productName} (${categoryName})`);
        successCount++;

      } catch (error) {
        console.error(`Error creating product from row:`, row, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Bulk Import Summary ===');
    console.log(`✓ Successfully imported: ${successCount} products`);
    console.log(`⊘ Skipped (duplicates/missing data): ${skipCount} products`);
    console.log(`✗ Errors: ${errorCount} products`);
    console.log('===========================\n');

  } catch (error) {
    console.error('Bulk import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

bulkImportProducts();
