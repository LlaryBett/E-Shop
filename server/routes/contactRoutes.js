const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, subject, message, phone } = req.body;

    // Send email to admin
    const adminEmailData = {
      to: process.env.ADMIN_EMAIL || 'admin@eshop.com',
      subject: `Contact Form: ${subject}`,
      template: 'contact-admin',
      data: {
        name,
        email,
        phone,
        subject,
        message,
        submittedAt: new Date().toLocaleString()
      }
    };

    // Send confirmation email to user
    const userEmailData = {
      to: email,
      subject: 'Thank you for contacting us',
      template: 'contact-confirmation',
      data: {
        name,
        subject
      }
    };

    await Promise.all([
      emailService.sendEmail(adminEmailData),
      emailService.sendEmail(userEmailData)
    ]);

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/contact/info
// @desc    Get contact information
// @access  Public
router.get('/info', (req, res) => {
  const contactInfo = {
    success: true,
    data: {
      address: {
        street: '123 E-Shop Street',
        city: 'Commerce City',
        state: 'Business State',
        zipCode: '12345',
        country: 'United States'
      },
      phone: '+1 (555) 123-4567',
      email: 'info@eshop.com',
      support: 'support@eshop.com',
      hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed'
      },
      social: {
        facebook: 'https://facebook.com/eshop',
        twitter: 'https://twitter.com/eshop',
        instagram: 'https://instagram.com/eshop',
        linkedin: 'https://linkedin.com/company/eshop'
      }
    }
  };

  res.json(contactInfo);
});

// @route   GET /api/contact/messages
// @desc    Get all contact messages (admin only)
// @access  Private (Admin)
router.get('/messages', auth, authorize('admin'), async (req, res) => {
  try {
    // This would require a ContactMessage model to store messages
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Contact messages endpoint - requires ContactMessage model implementation',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching contact messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
