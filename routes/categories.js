const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// GET /api/categories - list categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Helper to make URLs absolute
    const makeAbsolute = (url) => {
      if (!url) return url;
      if (/^https?:\/\//i.test(url)) return url;
      return `${req.protocol}://${req.get('host')}${url}`;
    };
    
    // Convert all category imageUrls to absolute
    const enrichedCategories = categories.map(category => {
      const categoryObj = category.toObject();
      if (categoryObj.imageUrl) {
        categoryObj.imageUrl = makeAbsolute(categoryObj.imageUrl);
      }
      return categoryObj;
    });
    
    res.json({ categories: enrichedCategories });
  } catch (err) {
    console.error('Get categories error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ category });
  } catch (err) {
    console.error('Get category error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories - create (admin)
// helper to slugify names
const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

router.post('/', auth, async (req, res) => {
  try {
    // only admins
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const name = req.body.name;
    const slug = req.body.slug && req.body.slug.trim() !== '' ? req.body.slug : slugify(name);
    const description = req.body.description;
    const imageUrl = req.body.imageUrl || req.body.image; // accept either field from client
  if (!name) return res.status(400).json({ message: 'Name is required' });

    // If exact name exists, block
    const nameExists = await Category.findOne({ name });
    if (nameExists) return res.status(400).json({ message: 'Category with same name exists' });

    // Ensure slug uniqueness by appending numeric suffix if necessary
    let finalSlug = slug;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (await Category.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${suffix++}`;
    }

    const category = new Category({ name, slug: finalSlug, description, imageUrl });
    console.log('Creating category', { name, slug: finalSlug });
    await category.save();
    const makeAbsolute = (url) => {
      if (!url) return url;
      if (/^https?:\/\//i.test(url)) return url;
      return `${req.protocol}://${req.get('host')}${url}`;
    };
    const catObj = category.toObject();
    if (catObj.imageUrl) catObj.imageUrl = makeAbsolute(catObj.imageUrl);
    res.status(201).json({ category: catObj });
  } catch (err) {
    console.error('Create category error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id - update (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const updates = { ...req.body };
    if (updates.name && (!updates.slug || updates.slug.trim() === '')) {
      updates.slug = slugify(updates.name);
    }
    if (updates.image && !updates.imageUrl) {
      updates.imageUrl = updates.image; // normalize image field
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const makeAbsolute = (url) => {
      if (!url) return url;
      if (/^https?:\/\//i.test(url)) return url;
      return `${req.protocol}://${req.get('host')}${url}`;
    };
    const catObj = category.toObject();
    if (catObj.imageUrl) catObj.imageUrl = makeAbsolute(catObj.imageUrl);
    res.json({ category: catObj });
  } catch (err) {
    console.error('Update category error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id - delete (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
