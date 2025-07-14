import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import mongoose from 'mongoose';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    // Apply filters
    if (req.query.search) query.$text = { $search: req.query.search };
    if (req.query.categories) {
      query.category = { $in: req.query.categories.split(',').map(id => new mongoose.Types.ObjectId(id)) };
    }
    if (req.query.brands) {
      query.brand = { $in: req.query.brands.split(',').map(id => new mongoose.Types.ObjectId(id)) };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.rating) query.rating = { $gte: parseFloat(req.query.rating) };
    if (req.query.inStock === 'true') query.stock = { $gt: 0 };
    if (req.query.onSale === 'true') query.salePrice = { $exists: true, $ne: null };

    // Fetch products with populated brand & category
    const products = await Product.find(query)
      .populate({
        path: 'brand',
        select: 'name logo',
        model: 'Brand'
      })
      .populate({
        path: 'category',
        select: 'name slug',
        model: 'Category'
      })
      .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      products,
      pagination: { page, pages, total, limit },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'category',
        select: 'name slug',
        model: 'Category'
      })
      .populate({
        path: 'brand',
        select: 'name logo',
        model: 'Brand'
      })
      .populate({
        path: 'createdBy',
        select: 'name',
        model: 'User'
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      title,
      description,
      price,
      salePrice,
      images,
      category,
      subcategory,
      brand,
      rating,
      reviewCount,
      stock,
      tags,
      variants,
      featured,
      trending,
      createdAt,
      updatedAt,
      sku,
    } = req.body;

    // Find category by name or ID
    const categoryDoc = await Category.findOne({
      $or: [
        { _id: category },
        { name: category.trim() }
      ]
    });
    
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    // Find brand by name or ID
    const brandDoc = await Brand.findOne({
      $or: [
        { _id: brand },
        { name: brand.trim() }
      ]
    });
    
    if (!brandDoc) {
      return res.status(400).json({
        success: false,
        message: `Brand '${brand}' not found`,
      });
    }

    const product = await Product.create({
      title,
      description,
      price,
      salePrice,
      images,
      category: categoryDoc._id,
      subcategory,
      brand: brandDoc._id,
      rating,
      reviewCount,
      stock,
      tags,
      variants,
      featured,
      trending,
      createdAt,
      updatedAt,
      sku,
      createdBy: req.user.id
    });

    // Populate the brand and category in the response
    const populatedProduct = await Product.findById(product._id)
      .populate('brand', 'name logo')
      .populate('category', 'name slug');

    res.status(201).json({
      success: true,
      product: populatedProduct,
    });
  } catch (error) {
    console.error('Product creation failed:', error);
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Handle category update
    if (req.body.category) {
      const categoryDoc = await Category.findOne({
        $or: [
          { _id: req.body.category },
          { name: req.body.category.trim() }
        ]
      });
      
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: `Category '${req.body.category}' not found`,
        });
      }
      req.body.category = categoryDoc._id;
    }

    // Handle brand update
    if (req.body.brand) {
      const brandDoc = await Brand.findOne({
        $or: [
          { _id: req.body.brand },
          { name: req.body.brand.trim() }
        ]
      });
      
      if (!brandDoc) {
        return res.status(400).json({
          success: false,
          message: `Brand '${req.body.brand}' not found`,
        });
      }
      req.body.brand = brandDoc._id;
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('brand', 'name logo')
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await Product.find({
      $text: { $search: q },
      isActive: true,
    })
      .populate('category', 'name slug')
      .populate('brand', 'name logo')
      .limit(20)
      .sort({ score: { $meta: 'textScore' } });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product suggestions
// @route   GET /api/products/suggestions
// @access  Public
export const getProductSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query is required',
      });
    }

    const suggestions = await Product.find({
      title: { $regex: q, $options: 'i' },
      isActive: true,
    })
      .select('title')
      .limit(5);

    res.status(200).json({
      success: true,
      suggestions: suggestions.map(p => p.title),
    });
  } catch (error) {
    next(error);
  }
};