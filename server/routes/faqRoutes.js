const express = require('express');
const FAQ = require('../models/FAQ');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/faq
// @desc    Get all active FAQs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const query = { status: 'active' };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const faqs = await FAQ.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select('-createdBy -updatedBy');

    // Group FAQs by category
    const faqsByCategory = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        faqs: category ? faqs : faqsByCategory,
        total: faqs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching FAQs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/faq/categories
// @desc    Get FAQ categories with counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await FAQ.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const categoryLabels = {
      general: 'General',
      orders: 'Orders',
      shipping: 'Shipping',
      returns: 'Returns & Refunds',
      payments: 'Payments',
      account: 'Account',
      products: 'Products',
      technical: 'Technical Support'
    };

    const categoriesWithLabels = categories.map(cat => ({
      key: cat._id,
      label: categoryLabels[cat._id] || cat._id,
      count: cat.count
    }));

    res.json({
      success: true,
      data: categoriesWithLabels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching FAQ categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/faq/popular
// @desc    Get most helpful FAQs
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const faqs = await FAQ.find({ status: 'active' })
      .sort({ 'helpful.yes': -1 })
      .limit(limit)
      .select('-createdBy -updatedBy');

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching popular FAQs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/faq/:id
// @desc    Get single FAQ
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const faq = await FAQ.findOne({ 
      _id: req.params.id, 
      status: 'active' 
    }).select('-createdBy -updatedBy');

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching FAQ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/faq
// @desc    Create new FAQ
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize('admin'),
  body('question').trim().isLength({ min: 10, max: 500 }).withMessage('Question must be between 10 and 500 characters'),
  body('answer').trim().isLength({ min: 10, max: 2000 }).withMessage('Answer must be between 10 and 2000 characters'),
  body('category').isIn(['general', 'orders', 'shipping', 'returns', 'payments', 'account', 'products', 'technical']).withMessage('Invalid category')
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

    const faqData = {
      ...req.body,
      createdBy: req.user._id
    };

    const faq = new FAQ(faqData);
    await faq.save();

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating FAQ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/faq/:id
// @desc    Update FAQ
// @access  Private (Admin)
router.put('/:id', [
  auth,
  authorize('admin'),
  validateObjectId
], async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    Object.assign(faq, req.body);
    faq.updatedBy = req.user._id;
    await faq.save();

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating FAQ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/faq/:id
// @desc    Delete FAQ
// @access  Private (Admin)
router.delete('/:id', [
  auth,
  authorize('admin'),
  validateObjectId
], async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await faq.deleteOne();

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting FAQ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/faq/:id/helpful
// @desc    Mark FAQ as helpful or not helpful
// @access  Public
router.post('/:id/helpful', [
  validateObjectId,
  body('helpful').isBoolean().withMessage('Helpful must be true or false')
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

    const faq = await FAQ.findOne({ 
      _id: req.params.id, 
      status: 'active' 
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    if (req.body.helpful) {
      faq.helpful.yes += 1;
    } else {
      faq.helpful.no += 1;
    }

    await faq.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback',
      data: {
        helpful: faq.helpful,
        helpfulPercentage: faq.helpfulPercentage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error processing feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/faq/reorder
// @desc    Reorder FAQs
// @access  Private (Admin)
router.put('/reorder', [
  auth,
  authorize('admin'),
  body('faqs').isArray().withMessage('FAQs must be an array'),
  body('faqs.*.id').isMongoId().withMessage('Invalid FAQ ID'),
  body('faqs.*.order').isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
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

    const { faqs } = req.body;
    
    // Update order for each FAQ
    const updatePromises = faqs.map(({ id, order }) => 
      FAQ.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'FAQ order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error reordering FAQs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
