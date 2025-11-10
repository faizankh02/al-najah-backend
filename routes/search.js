const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// GET /api/search?q=query - Search products and categories
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query || query.trim().length === 0) {
      return res.json({ products: [], categories: [] });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    // Search products (ONLY by name/title - exact match priority)
    const products = await Product.find({
      name: searchRegex
    })
    .populate('category', 'name slug')
    .limit(10)
    .select('name slug description images price category')
    .sort({ name: 1 });

    // Search categories (only by name)
    const categories = await Category.find({
      name: searchRegex
    })
    .limit(5)
    .select('name slug description image')
    .sort({ name: 1 });

    res.json({
      products: products,
      categories: categories,
      query: query
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
