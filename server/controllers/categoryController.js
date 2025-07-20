import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('subcategories')
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug description image parent subcategories isActive sortOrder seoKeywords createdAt updatedAt');

    // ✅ Log each category with its name and image URL
    console.log('[GET /api/categories] Categories:');
    categories.forEach((cat, idx) => {
      const imageUrl = cat.image?.url || 'N/A';
      console.log(`${idx + 1}. ${cat.name} - image: ${imageUrl}`);
    });

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('[GET /api/categories] Error:', error);
    next(error);
  }
};



// @desc    Get single category
// @route   GET /api/categories/:slug
// @access  Public
export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true
    })
      .populate('subcategories')
      .populate('productCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // ✅ Handle image upload and wrap it as { url }
    if (req.file && req.file.path) {
      req.body.image = { url: req.file.location || req.file.path };
    }

    const category = await Category.create(req.body);

    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $push: { subcategories: category._id } }
      );
    }

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Handle image upload: set image as string URL if file uploaded
    if (req.file && req.file.path) {
      req.body.image = req.file.location || req.file.path;
    } else if (req.body.image && typeof req.body.image === 'object' && req.body.image.url) {
      req.body.image = req.body.image.url;
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category has products
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: category._id });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products',
      });
    }

    // No need to delete image, just remove category
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { subcategories: category._id } }
      );
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find({
      parent: null,
      isActive: true
    })
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        populate: {
          path: 'subcategories',
          match: { isActive: true },
        },
      })
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};
