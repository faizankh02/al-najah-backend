const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration not found in environment variables. Email notifications will be skipped.');
    return null;
  }

  // Configure based on EMAIL_SERVICE or use custom SMTP settings
  const transportConfig = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // If using a known service like Gmail, Yahoo, etc.
  if (process.env.EMAIL_SERVICE) {
    transportConfig.service = process.env.EMAIL_SERVICE;
  } else {
    // Use custom SMTP settings
    transportConfig.host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    transportConfig.port = parseInt(process.env.EMAIL_PORT || '587');
    transportConfig.secure = process.env.EMAIL_SECURE === 'true';
  }

  return nodemailer.createTransporter(transportConfig);
};

// Send inquiry notification email to admin
const sendInquiryNotification = async (inquiry) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured. Skipping notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `"Al Najah Company" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New Inquiry from ${inquiry.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Customer Inquiry</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p><strong>Name:</strong> ${inquiry.name}</p>
            <p><strong>Email:</strong> ${inquiry.email}</p>
            <p><strong>Phone:</strong> ${inquiry.phone || 'N/A'}</p>
            <p><strong>Company:</strong> ${inquiry.company || 'N/A'}</p>
            ${inquiry.subject ? `<p><strong>Subject:</strong> ${inquiry.subject}</p>` : ''}
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${inquiry.message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This email was sent from the Al Najah Company inquiry form.
          </p>
        </div>
      `,
      text: `
New Customer Inquiry

Name: ${inquiry.name}
Email: ${inquiry.email}
Phone: ${inquiry.phone || 'N/A'}
Company: ${inquiry.company || 'N/A'}
${inquiry.subject ? `Subject: ${inquiry.subject}\n` : ''}
Message:
${inquiry.message}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Inquiry notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending inquiry notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInquiryNotification,
};
