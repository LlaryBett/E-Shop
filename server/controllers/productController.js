import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import mongoose from 'mongoose';
import NotificationService from '../middleware/NotificationService.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public


// @desc    Get all products (public or admin with includeInactive)
// @route   GET /api/products
// @access  Public | Admin (when includeInactive=true)
export const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Admins can see inactive products if includeInactive=true
    const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
    let query = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    // Apply filters (same as your second implementation)
    if (req.query.search) query.$text = { $search: req.query.search };
    if (req.query.categories) {
      // Accept both ObjectId and category slug/name
      const categoriesRaw = req.query.categories.split(',');
      const categoryIds = [];
      for (const cat of categoriesRaw) {
        // Try to convert to ObjectId, else find by slug or name
        if (/^[a-f\d]{24}$/i.test(cat)) {
          categoryIds.push(new mongoose.Types.ObjectId(cat));
        } else {
          // Find category by slug or name
          const found = await Category.findOne({
            $or: [{ slug: cat }, { name: cat }]
          }).select('_id');
          if (found) categoryIds.push(found._id);
        }
      }
      if (categoryIds.length > 0) {
        query.category = { $in: categoryIds };
      }
    }
    // Brand filter (fix: filter by brand ObjectId)
    let brandIds = [];
    if (req.query.brands) {
      brandIds = req.query.brands.split(',').map(id => {
        // Only accept valid ObjectId strings
        return /^[a-f\d]{24}$/i.test(id) ? new mongoose.Types.ObjectId(id) : null;
      }).filter(Boolean);
      if (brandIds.length > 0) {
        query.brand = { $in: brandIds };
      }
    }
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }
    if (req.query.rating) query.rating = { $gte: parseFloat(req.query.rating) };
    if (req.query.inStock === 'true') query.stock = { $gt: 0 };
    if (req.query.onSale === 'true') query.salePrice = { $exists: true, $ne: null };

    // Log filters and query for debugging
    console.log('[GET /api/products] Query params:', req.query);
    console.log('[GET /api/products] Mongo query:', JSON.stringify(query, null, 2));

    // Debug: Check actual brand values in products collection
    const debugBrands = await Product.distinct('brand');
    console.log('[GET /api/products] Distinct brand values in products:', debugBrands);

    // Debug: Check type of brand field in a sample product
    if (brandIds.length > 0) {
      const sampleProduct = await Product.findOne({ brand: brandIds[0] });
      console.log('[GET /api/products] Sample product for brand:', brandIds[0], sampleProduct);
    }

    // Fetch products
    const products = await Product.find(query)
      .populate('brand', 'name logo')
      .populate('category', 'name slug')
      .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('[GET /api/products] Products found:', products.length);

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

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name logo')
      .populate('category', 'name slug');

    if (!product || (!product.isActive && req.user?.role !== 'admin')) {
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

// Keep the rest of your functions (createProduct, updateProduct, etc.) unchanged.



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

    // Find category by name or ID (avoid ObjectId casting errors)
    const categoryQuery = { 
      $or: [
        { name: category.trim() },
        { slug: category.trim() }
      ]
    };
    
    // Only add ObjectId query if it's a valid ObjectId format
    if (/^[0-9a-fA-F]{24}$/.test(category)) {
      categoryQuery.$or.push({ _id: category });
    }

    const categoryDoc = await Category.findOne(categoryQuery);
        
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: `Category '${category}' not found`,
      });
    }

    // Validate subcategory exists within the selected category
    if (subcategory) {
      const subcategoryExists = categoryDoc.subcategories.some(subcat => 
        subcat.name === subcategory.trim() || 
        subcat.slug === subcategory.trim()
      );
      
      if (!subcategoryExists) {
        // Get all available subcategories for helpful error message
        const availableSubcategories = categoryDoc.subcategories.map(sub => sub.name);
        return res.status(400).json({
          success: false,
          message: `Subcategory '${subcategory}' not found in category '${categoryDoc.name}'`,
          availableSubcategories,
        });
      }
    }

    // Find brand by name or ID (avoid ObjectId casting errors)
    const brandQuery = { 
      $or: [
        { name: brand.trim() }
      ]
    };
    
    // Only add ObjectId query if it's a valid ObjectId format
    if (/^[0-9a-fA-F]{24}$/.test(brand)) {
      brandQuery.$or.push({ _id: brand });
    }

    const brandDoc = await Brand.findOne(brandQuery);
        
    if (!brandDoc) {
      return res.status(400).json({
        success: false,
        message: `Brand '${brand}' not found`,
      });
    }

    // Generate SKU if not provided
    const generateProductSKU = (category, subcategory, title) => {
      const categoryCode = category.name.substring(0, 3).toUpperCase();
      const subcategoryCode = subcategory ? subcategory.substring(0, 3).toUpperCase() : 'GEN';
      const titleCode = title.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      
      return `${categoryCode}-${subcategoryCode}-${titleCode}-${timestamp}`;
    };

    const productSku = sku || generateProductSKU(categoryDoc, subcategory, title);

    // ✅ FIX 1: Transform images from string array to object array
    const transformedImages = Array.isArray(images) 
      ? images.map((imageUrl, index) => ({
          url: typeof imageUrl === 'string' ? imageUrl : imageUrl.url,
          publicId: typeof imageUrl === 'object' ? imageUrl.publicId || '' : '',
          altText: typeof imageUrl === 'object' ? imageUrl.altText || `${title} - Image ${index + 1}` : `${title} - Image ${index + 1}`,
          isPrimary: index === 0
        }))
      : [];

    // ✅ FIX 2: Transform variants to match schema requirements
    const transformedVariants = Array.isArray(variants) 
      ? variants.map(variant => ({
          name: variant.name || variant.size || 'Size', // Use 'name' field as required by schema
          value: variant.value || variant.size || variant.count || 'Default', // Use 'value' field as required by schema
          price: variant.price || 0,
          stock: variant.stock || 0,
          sku: variant.sku || '',
          // Keep original fields for reference
          originalData: variant
        }))
      : [];

    const product = await Product.create({
      title,
      description,
      price,
      salePrice,
      images: transformedImages, // ✅ Use transformed images
      category: categoryDoc._id,
      subcategory,
      brand: brandDoc._id,
      rating,
      reviewCount,
      stock,
      tags,
      variants: transformedVariants, // ✅ Use transformed variants
      featured,
      trending,
      createdAt,
      updatedAt,
      sku: productSku,
      createdBy: req.user.id
    });

    // Populate the brand and category in the response
    const populatedProduct = await Product.findById(product._id)
      .populate('brand', 'name logo')
      .populate('category', 'name slug');

    // Add subcategory info to the response
    if (subcategory && categoryDoc.subcategories) {
      const subcatInfo = categoryDoc.subcategories.find(sub => 
        sub.name === subcategory || sub.slug === subcategory
      );
      populatedProduct._doc.subcategoryInfo = subcatInfo || null;
    }

    // Send notification to all admins (example event)
    try {
      // Find all admin users
      const admins = await mongoose.model('User').find({ role: 'admin' }).select('_id');
      const adminIds = admins.map(admin => admin._id);

      // To consult NotificationEvent.js, use:
      await NotificationService.triggerEvent(adminIds, 'product_created', {
        title: populatedProduct.title,
        productId: populatedProduct._id,
        category: categoryDoc.name,
        subcategory: subcategory || 'General'
      });
    } catch (notifError) {
      console.error('Failed to send admin notification:', notifError);
    }

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

    // Track if discount is being added or updated
    const hadSalePrice = !!product.salePrice;
    const newSalePrice = req.body.salePrice;

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

    // If a new discount is added or updated, trigger a notification event
    if ((!hadSalePrice && newSalePrice) || (hadSalePrice && newSalePrice && newSalePrice !== product.salePrice)) {
      try {
        // Find all users with this product in their wishlist (example logic)
        const Wishlist = mongoose.model('Wishlist');
        const wishlists = await Wishlist.find({ 'items.product': product._id }).select('user');
        const userIds = wishlists.map(w => w.user);

        // This does NOT consult NotificationEvent.js directly:
        // await NotificationService.sendWishlistNotification(userIds, { ... });

        // To consult NotificationEvent.js, use:
        await NotificationService.triggerEvent(userIds, 'product_discount', {
          productName: product.title,
          discount: Math.round(((product.price - newSalePrice) / product.price) * 100),
          productId: product._id
        });
      } catch (notifError) {
        console.error('Failed to send discount notification:', notifError);
      }
    }

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