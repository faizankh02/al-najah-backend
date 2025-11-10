const Inquiry = require('../models/Inquiry');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get all inquiries (admin only)
exports.getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('productId', 'name')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create inquiry (public)
exports.createInquiry = async (req, res) => {
  try {
    const inquiry = new Inquiry({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
      productId: req.body.productId
    });

    const newInquiry = await inquiry.save();

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Inquiry Received',
      html: `
        <h2>New Inquiry from ${inquiry.name}</h2>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        <p><strong>Phone:</strong> ${inquiry.phone}</p>
        <p><strong>Message:</strong> ${inquiry.message}</p>
        ${inquiry.productId ? `<p><strong>Product ID:</strong> ${inquiry.productId}</p>` : ''}
        <p><strong>Received at:</strong> ${inquiry.createdAt}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json(newInquiry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update inquiry status (admin only)
exports.updateInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    if (req.body.status) {
      inquiry.status = req.body.status;
    }

    const updatedInquiry = await inquiry.save();
    res.json(updatedInquiry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};