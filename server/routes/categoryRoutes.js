const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { auth, admin } = require('../middleware/auth');
const { validateCategory, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const filter = includeInactive === 'true' ? {} : { isActive: true };

    const categories = await Category.find(filter)
      .populate('subcategories')
      .populate('productCount')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Organize categories into hierarchy
    const parentCategories = categories.filter(cat => !cat.parent);
    const subcategories = categories.filter(cat => cat.parent);

    const categoriesWithSubs = parentCategories.map(parent => ({
      ...parent,
      subcategories: subcategories.filter(sub => 
        sub.parent && sub.parent.toString() === parent._id.toString()
      )
    }));

    res.json({
      success: true,
      data: {
        categories: categoriesWithSubs,
        totalCategories: categories.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories')
      .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products in this category
    const products = await Product.find({
      category: category._id,
      status: 'active'
    })
      .populate('category', 'name slug')
      .limit(12)
      .lean();

    res.json({
      success: true,
      data: {
        category,
        products
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/categories/slug/:slug
// @desc    Get category by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('subcategories')
      .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products in this category
    const products = await Product.find({
      category: category._id,
      status: 'active'
    })
      .populate('category', 'name slug')
      .sort({ featured: -1, createdAt: -1 })
      .limit(20)
      .lean();

    // Get category statistics
    const stats = await Product.aggregate([
      { $match: { category: category._id, status: 'active' } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          averageRating: { $avg: '$rating.average' }
        }
      }
    ]);

    const categoryStats = stats[0] || {
      totalProducts: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      averageRating: 0
    };

    res.json({
      success: true,
      data: {
        category,
        products,
        stats: categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/', auth, admin, validateCategory, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/:id', auth, admin, validateObjectId, validateCategory, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent circular parent relationships
    if (req.body.parent) {
      const parent = await Category.findById(req.body.parent);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Check if trying to set self as parent
      if (req.body.parent === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      // Check if trying to create circular reference
      let currentParent = parent;
      while (currentParent && currentParent.parent) {
        if (currentParent.parent.toString() === req.params.id) {
          return res.status(400).json({
            success: false,
            message: 'Circular parent relationship not allowed'
          });
        }
        currentParent = await Category.findById(currentParent.parent);
      }
    }

    Object.assign(category, req.body);
    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/:id', auth, admin, validateObjectId, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products. Please move or delete products first.'
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parent: category._id });
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please move or delete subcategories first.'
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Get products in a category
// @access  Public
router.get('/:id/products', validateObjectId, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = '-createdAt',
      minPrice,
      maxPrice,
      rating,
      inStock,
      featured
    } = req.query;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Build filter
    const filter = {
      category: category._id,
      status: 'active'
    };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price':
        sortOption = { price: 1 };
        break;
      case '-price':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { 'rating.average': 1 };
        break;
      case '-rating':
        sortOption = { 'rating.average': -1 };
        break;
      case 'title':
        sortOption = { title: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description
        },
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching category products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
