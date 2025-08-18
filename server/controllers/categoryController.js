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
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    const transformed = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await mongoose.model('Product').countDocuments({ 
          category: cat._id,
          isActive: true 
        });

        return {
          name: cat.name,
          icon: cat.icon,
          count: productCount,
          description: cat.description,
          image: cat.image,
          isNavItem: cat.isNavItem,
          navPosition: cat.navPosition,
          navIcon: cat.navIcon,
          slug: cat.slug,
          subcategories: cat.subcategories // Directly use nested data
        };
      })
    );

    res.status(200).json({ 
      success: true, 
      count: transformed.length,
      data: transformed 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mega menu categories (improved)
// @route   GET /api/categories?megaMenu=true  
// @access  Public
export const getMegaMenuCategories = async (req, res, next) => {
  try {
    // 1. Get all active categories (no parent filter needed)
    const categories = await Category.find({ 
      isActive: true,
      'menuConfig.displayInMegaMenu': true 
    }).sort({ 'menuConfig.columnPosition': 1, sortOrder: 1, name: 1 });

    // 2. Get product counts (if needed)
    const Product = mongoose.model('Product');
    const megaMenuData = {};

    for (const category of categories) {
      const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });

      // 3. Transform to frontend format
      const categoryKey = category._id.toString();
      
      megaMenuData[categoryKey] = {
        name: category.name,
        icon: category.icon,
        count: productCount,
        description: category.description,
        image: category.image.url,
        isNavItem: category.isNavItem,
        navPosition: category.navPosition,
        navIcon: category.navIcon,
        subcategories: category.subcategories.map(sub => ({
          name: sub.name,
          items: sub.items || [] // Directly use nested items
        }))
      };
    }

    res.status(200).json({
      success: true,
      count: categories.length,
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
    });

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found'
      });
    }

    const productCount = await mongoose.model('Product').countDocuments({
      category: category._id,
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        ...category.toObject(),
        productCount
      }
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
    const { 
      name, 
      description, 
      icon = 'Package', 
      image, 
      subcategories = [], 
      isNavItem = false,
      navPosition = 0,
      navIcon = icon,
      menuConfig = {
        displayInMegaMenu: false,
        columnPosition: 1
      }
    } = req.body;

    // 1. Create category with nested subcategories
    const category = new Category({
      name,
      description,
      icon,
      image: typeof image === 'string' 
        ? { url: image, publicId: '' } 
        : image || { url: '', publicId: '' },
      isActive: true,
      sortOrder: 0,
      isNavItem,
      navPosition,
      navIcon,
      menuConfig,
      subcategories: subcategories.map(sub => ({
        name: sub.name,
        items: sub.items.map(item => ({
          name: item.name,
          slug: item.slug
        }))
      }))
    });

    // 2. Save everything in one operation
    await category.save();

    // 3. Prepare response (matches schema structure)
    const responseData = {
      _id: category._id,
      name: category.name,
      icon: category.icon,
      image: category.image.url,
      description: category.description,
      isNavItem: category.isNavItem,
      navPosition: category.navPosition,
      navIcon: category.navIcon,
      subcategories: category.subcategories.map(sub => ({
        name: sub.name,
        items: sub.items.map(item => ({
          name: item.name,
          slug: item.slug
        }))
      }))
    };

    res.status(201).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("Error in createCategory:", error);
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
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Get products by subcategory item
// @route   GET /api/categories/:categorySlug/subcategory/:itemSlug/products
// @access  Public
export const getProductsBySubcategoryItem = async (req, res, next) => {
  try {
    const { categorySlug, itemSlug } = req.params;
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    // Find the category first
    const category = await Category.findOne({ 
      slug: categorySlug, 
      isActive: true 
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Find the specific subcategory item to get its details
    let subcategoryItem = null;
    let subcategoryGroup = null;
    
    for (const subcat of category.subcategories) {
      const foundItem = subcat.items?.find(item => item.slug === itemSlug);
      if (foundItem) {
        subcategoryItem = foundItem;
        subcategoryGroup = subcat;
        break;
      }
    }

    if (!subcategoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory item not found'
      });
    }

    // Find products that match both category and subcategory item
    const Product = mongoose.model('Product');
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    const products = await Product.find({
      category: category._id,
      $or: [
        { subcategoryItemSlug: itemSlug },
        { subcategoryItemId: subcategoryItem._id || subcategoryItem.id },
        // Fallback: match by subcategory item name
        { subcategory: subcategoryItem.name }
      ],
      isActive: true
    })
    .populate('category', 'name slug')
    .populate('brand', 'name logo')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const totalProducts = await Product.countDocuments({
      category: category._id,
      $or: [
        { subcategoryItemSlug: itemSlug },
        { subcategoryItemId: subcategoryItem._id || subcategoryItem.id },
        { subcategory: subcategoryItem.name }
      ],
      isActive: true
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      categoryInfo: {
        name: category.name,
        slug: category.slug
      },
      subcategoryInfo: {
        groupName: subcategoryGroup.name,
        itemName: subcategoryItem.name,
        itemSlug: subcategoryItem.slug
      },
      data: products
    });

  } catch (error) {
    console.error('Error in getProductsBySubcategoryItem:', error);
    next(error);
  }
};