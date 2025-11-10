const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const auth = require('../middleware/auth');
const { sendInquiryNotification } = require('../utils/emailService');

// POST /api/inquiries - public, create an inquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required' });

    const inquiry = new Inquiry({ name, email, phone, company, subject, message });
    await inquiry.save();

    // Send notification email to admin (non-blocking)
    sendInquiryNotification(inquiry).catch(err => {
      console.error('Failed to send inquiry notification:', err);
    });

    res.status(201).json({ inquiry });
  } catch (err) {
    console.error('Create inquiry error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/inquiries - admin only
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ inquiries });
  } catch (err) {
    console.error('Get inquiries error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/inquiries/:id - admin
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ inquiry });
  } catch (err) {
    console.error('Get inquiry error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/inquiries/:id - update status or reply (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const updates = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ inquiry });
  } catch (err) {
    console.error('Update inquiry error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/inquiries/:id - admin
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry deleted' });
  } catch (err) {
    console.error('Delete inquiry error', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
