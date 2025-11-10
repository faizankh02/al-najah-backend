require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const categories = [
  {
    name: 'Hand Tools',
    description: 'Premium quality hammers, screwdrivers, wrenches, pliers, and complete hand tool sets for professional use.',
    imageUrl: 'https://images.unsplash.com/photo-1452860981521-206b5ccee1df?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Power Tools',
    description: 'Industrial-grade drills, grinders, saws, and power equipment from leading manufacturers.',
    imageUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fasteners & Screws',
    description: 'Comprehensive range of bolts, nuts, screws, anchors, and fastening solutions for all applications.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Safety Equipment',
    description: 'Complete safety gear including helmets, gloves, protective wear, and workplace safety solutions.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Electrical & Lighting',
    description: 'Electrical supplies, LED lighting, cables, switches, and complete electrical fittings.',
    imageUrl: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cutting & Measuring Tools',
    description: 'Saws, tape measures, calipers, and other precision tools for cutting and measuring.',
    imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Building Materials',
    description: 'Cement, bricks, blocks, and essential construction materials for all building projects.',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Painting & Finishing',
    description: 'Professional painting supplies, brushes, rollers, and finishing materials for perfect results.',
    imageUrl: 'https://images.unsplash.com/photo-1506224774225-0fdb2ffba47c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Miscellaneous Industrial Supplies',
    description: 'Measuring tools, adhesives, tapes, and diverse industrial hardware for various applications.',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
  },
];

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alnajah');

    for (const category of categories) {
      const slug = slugify(category.name);
      const existing = await Category.findOne({ slug });
      if (existing) {
        console.log(`Skipping existing category: ${category.name}`);
        continue;
      }

      const created = await Category.create({
        name: category.name,
        slug,
        description: category.description,
        imageUrl: category.imageUrl,
      });

      console.log(`Created category: ${created.name} (${created._id.toString()})`);
    }

        { name: "Cutting & Measuring Tools", description: "Saws, tape measures, calipers, and other precision tools for cutting and measuring." },
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
