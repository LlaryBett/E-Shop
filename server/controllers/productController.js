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

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    if (req.query.categories) {
      const categories = req.query.categories.split(',');
      query.category = { $in: categories };
    }

    if (req.query.brands) {
      const brands = req.query.brands.split(',');
      query.brand = { $in: brands };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.rating) {
      query.rating = { $gte: parseFloat(req.query.rating) };
    }

    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    if (req.query.onSale === 'true') {
      query.salePrice = { $exists: true, $ne: null };
    }

    if (req.query.featured === 'true') {
      query.featured = true;
    }

    if (req.query.trending === 'true') {
      query.trending = true;
    }

    let sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        pages,
        total,
        limit,
      },
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
      .populate('category', 'name slug')
      .populate('brand', 'name')
      .populate('createdBy', 'name');

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

    // 🔍 Log the full request body
    console.log('📦 Incoming product payload:', req.body);

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
      sku, // explicitly include for clarity
    } = req.body;

    // Log specifically the SKU value
    console.log('🔑 SKU:', sku);

    const categoryDoc = await Category.findOne({ name: category.trim() });
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    const brandDoc = await Brand.findOne({ name: brand.trim() });
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

    console.log('✅ Product to be saved:', product);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('❌ Product creation failed:', error);
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

    // Convert category/brand if provided as name
    if (req.body.category) {
      const categoryDoc = await Category.findOne({ name: req.body.category.trim() });
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: `Category '${req.body.category}' not found`,
        });
      }
      req.body.category = categoryDoc._id;
    }

    if (req.body.brand) {
      const brandDoc = await Brand.findOne({ name: req.body.brand.trim() });
      if (!brandDoc) {
        return res.status(400).json({
          success: false,
          message: `Brand '${req.body.brand}' not found`,
        });
      }
      req.body.brand = brandDoc._id;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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
