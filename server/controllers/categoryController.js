import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

// Icon mapping for frontend compatibility
const getIconForCategory = (slug) => {
  const iconMap = {
    'promos': 'Star',
    'food-cupboard': 'Package', 
    'fresh-food': 'Apple',
    'electronics': 'Smartphone',
    'fashion': 'Shirt',
    'home-garden': 'Home',
    'voucher': 'Gift'
  };
  return iconMap[slug] || 'Package';
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    // Check if mega menu format is requested
    const megaMenu = req.query.megaMenu === 'true';
    
    if (megaMenu) {
      return getMegaMenuCategories(req, res, next);
    }

    // Original implementation with proper population
    const categories = await Category.find({ isActive: true })
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        select: 'name slug description image menuConfig'
      })
      .sort({ sortOrder: 1, name: 1 })
      .select('name slug description image parent subcategories isActive sortOrder seoKeywords createdAt updatedAt menuConfig');

    // Add product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const Product = mongoose.model('Product');
        const productCount = await Product.countDocuments({ 
          category: category._id,
          isActive: true 
        });
        
        return {
          ...category.toObject(),
          productCount,
          icon: getIconForCategory(category.slug)
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    next(error);
  }
};

// @desc    Get mega menu categories (improved)
// @route   GET /api/categories?megaMenu=true  
// @access  Public
export const getMegaMenuCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ 
      isActive: true,
      parent: null // Only get top-level categories
    })
    .sort({ sortOrder: 1, name: 1 })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug image menuConfig',
      populate: {
        path: 'subcategories', // For nested subcategories if needed
        match: { isActive: true },
        select: 'name slug'
      }
    });

    // Transform to frontend-friendly format matching your original structure
    const megaMenuData = {};
    
    for (const category of categories) {
      const Product = mongoose.model('Product');
      
      // Get product count for this category and all its subcategories
      const categoryIds = [category._id, ...category.subcategories.map(sub => sub._id)];
      const productCount = await Product.countDocuments({ 
        category: { $in: categoryIds },
        isActive: true 
      });

      // Transform subcategories to match frontend format
      const subcategories = category.subcategories.map(sub => ({
        name: sub.name,
        items: sub.menuConfig?.featuredItems?.length > 0 
          ? sub.menuConfig.featuredItems 
          : [{ name: sub.name, slug: sub.slug }]
      }));

      // Use a generated ID or the MongoDB _id
      const categoryKey = category._id.toString();
      
      megaMenuData[categoryKey] = {
        name: category.name,
        icon: getIconForCategory(category.slug),
        count: productCount,
        description: category.description,
        slug: category.slug,
        subcategories: subcategories
      };
    }

    res.status(200).json({
      success: true,
      data: megaMenuData
    });
  } catch (error) {
    console.error('Error in getMegaMenuCategories:', error);
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
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug description image'
    })
    .populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Get product count
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ 
      category: category._id,
      isActive: true 
    });

    const categoryData = {
      ...category.toObject(),
      productCount,
      icon: getIconForCategory(category.slug)
    };

    res.status(200).json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    console.error('Error in getCategory:', error);
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

    const { name, description, parent, isActive, sortOrder, menuConfig } = req.body;

    // Check if category with same name exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    // Process image
    const imageData = {
      url: req.file?.location || req.file?.path || '',
      publicId: req.file?.filename || ''
    };

    // Create category
    const category = new Category({
      name,
      description,
      image: imageData,
      parent: parent || null,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
      menuConfig: {
        featuredItems: menuConfig?.featuredItems || [],
        displayInMegaMenu: menuConfig?.displayInMegaMenu || false,
        columnPosition: menuConfig?.columnPosition || 1
      }
    });

    await category.save();

    // Update parent if this is a subcategory
    if (parent) {
      await Category.findByIdAndUpdate(
        parent,
        { $addToSet: { subcategories: category._id } }, // Use $addToSet to avoid duplicates
        { new: true }
      );
    }

    // Return the created category with populated fields
    const createdCategory = await Category.findById(category._id)
      .populate('parent', 'name slug')
      .populate('subcategories', 'name slug');

    res.status(201).json({
      success: true,
      data: {
        ...createdCategory.toObject(),
        icon: getIconForCategory(createdCategory.slug)
      }
    });

  } catch (error) {
    console.error('Error in createCategory:', error);
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

    // Handle image upload
    if (req.file) {
      req.body.image = {
        url: req.file.location || req.file.path,
        publicId: req.file.filename || ''
      };
    }

    // Update category
    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('parent', 'name slug')
     .populate('subcategories', 'name slug');

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        icon: getIconForCategory(category.slug)
      }
    });
  } catch (error) {
    console.error('Error in updateCategory:', error);
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
        message: `Cannot delete category with ${productCount} existing products. Please move or delete the products first.`,
      });
    }

    // Check if category has subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.',
      });
    }

    // Remove from parent's subcategories array if it's a subcategory
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { subcategories: category._id } }
      );
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
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

    // Add icons and product counts
    const categoriesWithExtras = await Promise.all(
      categories.map(async (category) => {
        const Product = mongoose.model('Product');
        const productCount = await Product.countDocuments({ 
          category: category._id,
          isActive: true 
        });
        
        return {
          ...category.toObject(),
          productCount,
          icon: getIconForCategory(category.slug)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithExtras,
    });
  } catch (error) {
    console.error('Error in getCategoryTree:', error);
    next(error);
  }
};