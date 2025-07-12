const express = require('express');
const PageContent = require('../models/PageContent');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/content/:pageKey
// @desc    Get page content by key
// @access  Public
router.get('/:pageKey', async (req, res) => {
  try {
    const { pageKey } = req.params;
    
    let content = await PageContent.findOne({ 
      pageKey, 
      status: 'active' 
    }).select('-lastUpdatedBy');

    // If no content exists, return default content
    if (!content) {
      content = getDefaultContent(pageKey);
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Page content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching page content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/content/:pageKey
// @desc    Update page content
// @access  Private (Admin)
router.put('/:pageKey', auth, authorize('admin'), async (req, res) => {
  try {
    const { pageKey } = req.params;
    const updateData = {
      ...req.body,
      pageKey,
      lastUpdatedBy: req.user._id
    };

    const content = await PageContent.findOneAndUpdate(
      { pageKey },
      updateData,
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    res.json({
      success: true,
      message: 'Page content updated successfully',
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating page content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/content
// @desc    Get all page contents (admin)
// @access  Private (Admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const contents = await PageContent.find()
      .populate('lastUpdatedBy', 'name email')
      .sort('pageKey');

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching page contents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to provide default content
function getDefaultContent(pageKey) {
  const defaultContents = {
    about: {
      pageKey: 'about',
      title: 'About E-Shop',
      content: `
        <div class="prose max-w-none">
          <h2>Welcome to E-Shop</h2>
          <p>E-Shop is your premier destination for quality products and exceptional customer service. Founded with a vision to provide customers with the best online shopping experience, we have been serving customers worldwide with dedication and commitment.</p>
          
          <h3>Our Mission</h3>
          <p>To provide high-quality products at competitive prices while ensuring exceptional customer service and satisfaction.</p>
          
          <h3>Our Values</h3>
          <ul>
            <li><strong>Quality:</strong> We carefully curate our products to ensure the highest standards.</li>
            <li><strong>Customer Service:</strong> Your satisfaction is our top priority.</li>
            <li><strong>Innovation:</strong> We continuously improve our platform and services.</li>
            <li><strong>Trust:</strong> We build lasting relationships with our customers.</li>
          </ul>
          
          <h3>Why Choose E-Shop?</h3>
          <p>With thousands of satisfied customers, competitive prices, fast shipping, and excellent customer support, E-Shop is your trusted partner for online shopping.</p>
        </div>
      `,
      metaTitle: 'About E-Shop - Your Trusted Online Shopping Destination',
      metaDescription: 'Learn about E-Shop, our mission, values, and commitment to providing quality products and exceptional customer service.',
      status: 'active',
      sections: [
        {
          title: 'Our Story',
          content: 'E-Shop was founded with a simple idea: make online shopping better for everyone.',
          order: 1
        },
        {
          title: 'Our Mission',
          content: 'To provide high-quality products at competitive prices with exceptional service.',
          order: 2
        }
      ]
    },
    
    privacy: {
      pageKey: 'privacy',
      title: 'Privacy Policy',
      content: `
        <div class="prose max-w-none">
          <h2>Privacy Policy</h2>
          <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
          
          <p>This Privacy Policy describes how E-Shop collects, uses, and protects your personal information when you use our website and services.</p>
          
          <h3>Information We Collect</h3>
          <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
          
          <h3>How We Use Your Information</h3>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
          
          <h3>Information Sharing</h3>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
          
          <h3>Data Security</h3>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h3>Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@eshop.com.</p>
        </div>
      `,
      metaTitle: 'Privacy Policy - E-Shop',
      metaDescription: 'Learn how E-Shop collects, uses, and protects your personal information.',
      status: 'active'
    },
    
    terms: {
      pageKey: 'terms',
      title: 'Terms of Service',
      content: `
        <div class="prose max-w-none">
          <h2>Terms of Service</h2>
          <p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>
          
          <p>These Terms of Service govern your use of the E-Shop website and services.</p>
          
          <h3>Acceptance of Terms</h3>
          <p>By using our services, you agree to be bound by these terms and conditions.</p>
          
          <h3>Use of Services</h3>
          <p>You may use our services only for lawful purposes and in accordance with these terms.</p>
          
          <h3>Account Registration</h3>
          <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
          
          <h3>Orders and Payments</h3>
          <p>All orders are subject to acceptance and availability. Prices are subject to change without notice.</p>
          
          <h3>Limitation of Liability</h3>
          <p>E-Shop shall not be liable for any indirect, incidental, special, or consequential damages.</p>
          
          <h3>Contact Information</h3>
          <p>For questions about these terms, contact us at legal@eshop.com.</p>
        </div>
      `,
      metaTitle: 'Terms of Service - E-Shop',
      metaDescription: 'Read our terms of service and conditions for using E-Shop.',
      status: 'active'
    }
  };

  return defaultContents[pageKey] || null;
}

module.exports = router;
