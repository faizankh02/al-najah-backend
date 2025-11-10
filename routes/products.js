const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Helper to make URLs absolute
const makeAbsolute = (url, req) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${req.protocol}://${req.get('host')}${url}`;
};

// GET /api/products - list products (with optional category filter, search)
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];

    const products = await Product.find(filter).populate('category');
    
    // Convert all product image URLs to absolute
    const productsWithAbsoluteUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = productObj.images.map(img => makeAbsolute(img, req));
      }
      return productObj;
    });
    
    res.json({ products: productsWithAbsoluteUrls });
  } catch (err) {
    console.error('Get products error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Convert product image URLs to absolute
    const productObj = product.toObject();
    if (productObj.images && Array.isArray(productObj.images)) {
      productObj.images = productObj.images.map(img => makeAbsolute(img, req));
    }
    
    res.json({ product: productObj });
  } catch (err) {
    console.error('Get product error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products - create product (admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { name, categoryId, description, images, specs, price } = req.body;
    if (!name || !categoryId) return res.status(400).json({ message: 'Name and category are required' });

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // verify category exists
    const cat = await Category.findById(categoryId);
    if (!cat) return res.status(400).json({ message: 'Invalid category' });

    const existing = await Product.findOne({ slug });
    if (existing) {
      // If slug exists, append a random number
      const randomSuffix = Math.floor(Math.random() * 10000);
      const newSlug = `${slug}-${randomSuffix}`;
      const product = new Product({ 
        name, 
        slug: newSlug, 
        category: categoryId, 
        description, 
        images: images || [], 
        specs: specs || {}, 
        price 
      });
      await product.save();
      const populatedProduct = await Product.findById(product._id).populate('category');
      
      // Convert image URLs to absolute before sending response
      const productObj = populatedProduct.toObject();
      if (productObj.images && Array.isArray(productObj.images)) {
        productObj.images = productObj.images.map(img => makeAbsolute(img, req));
      }
      
      return res.status(201).json({ product: productObj });
    }

    const product = new Product({ 
      name, 
      slug, 
      category: categoryId, 
      description, 
      images: images || [], 
      specs: specs || {}, 
      price 
    });
    await product.save();
    const populatedProduct = await Product.findById(product._id).populate('category');
    
    // Convert image URLs to absolute before sending response
    const productObj = populatedProduct.toObject();
    if (productObj.images && Array.isArray(productObj.images)) {
      productObj.images = productObj.images.map(img => makeAbsolute(img, req));
    }
    
    res.status(201).json({ product: productObj });
  } catch (err) {
    console.error('Create product error', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/products/:id - update product (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const updates = req.body;
    if (updates.category) {
      const cat = await Category.findById(updates.category);
      if (!cat) return res.status(400).json({ message: 'Invalid category' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('category');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Convert image URLs to absolute before sending response
    const productObj = product.toObject();
    if (productObj.images && Array.isArray(productObj.images)) {
      productObj.images = productObj.images.map(img => makeAbsolute(img, req));
    }
    
    res.json({ product: productObj });
  } catch (err) {
    console.error('Update product error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id - delete (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
