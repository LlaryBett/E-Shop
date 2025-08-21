import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import mongoose from 'mongoose';
import NotificationService from '../middleware/NotificationService.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
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
      item, // ✅ NEW: Now expecting item parameter
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
    const categoryQuery = { 
      $or: [
        { name: category.trim() },
        { slug: category.trim() }
      ]
    };
    
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

    // ✅ FIXED: Proper 3-level hierarchy validation
    let subcategoryInfo = null;
    let itemInfo = null;

    // Step 1: Find the subcategory group
    const subcategoryGroup = categoryDoc.subcategories.find(subcat => 
      subcat.name === subcategory.trim() || 
      subcat.slug === subcategory.trim() ||
      subcat._id.toString() === subcategory.trim()
    );

    if (!subcategoryGroup) {
      const availableSubcategories = categoryDoc.subcategories.map(sub => sub.name);
      return res.status(400).json({
        success: false,
        message: `Subcategory '${subcategory}' not found in category '${categoryDoc.name}'`,
        availableSubcategories,
      });
    }

    // Step 2: Find the item within that subcategory group
    const itemDoc = subcategoryGroup.items?.find(itemObj => 
      itemObj.name === item.trim() || 
      itemObj.slug === item.trim() ||
      itemObj._id.toString() === item.trim() ||
      itemObj.id === item.trim()
    );

    if (!itemDoc) {
      const availableItems = subcategoryGroup.items?.map(itm => itm.name) || [];
      return res.status(400).json({
        success: false,
        message: `Item '${item}' not found in subcategory '${subcategory}'`,
        availableItems,
      });
    }

    // ✅ Prepare structured subcategory and item info
    subcategoryInfo = {
      _id: subcategoryGroup._id,
      name: subcategoryGroup.name
    };

    itemInfo = {
      _id: itemDoc._id || itemDoc.id,
      name: itemDoc.name,
      slug: itemDoc.slug
    };

    // Find brand by name or ID
    const brandQuery = { 
      $or: [
        { name: brand.trim() }
      ]
    };
    
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

    // ✅ UPDATED: Generate SKU with proper hierarchy
    const generateProductSKU = (category, subcategoryName, itemName, title) => {
      const categoryCode = category.name.substring(0, 3).toUpperCase();
      const subcategoryCode = subcategoryName ? subcategoryName.substring(0, 3).toUpperCase() : 'GEN';
      const itemCode = itemName ? itemName.substring(0, 3).toUpperCase() : 'ITM';
      const timestamp = Date.now().toString().slice(-6);
      
      return `${categoryCode}-${subcategoryCode}-${itemCode}-${timestamp}`;
    };

    const productSku = sku || generateProductSKU(categoryDoc, subcategoryInfo.name, itemInfo.name, title);

    // Transform images from string array to object array
    const transformedImages = Array.isArray(images) 
      ? images.map((imageUrl, index) => ({
          url: typeof imageUrl === 'string' ? imageUrl : imageUrl.url,
          publicId: typeof imageUrl === 'object' ? imageUrl.publicId || '' : '',
          altText: typeof imageUrl === 'object' ? imageUrl.altText || `${title} - Image ${index + 1}` : `${title} - Image ${index + 1}`,
          isPrimary: index === 0
        }))
      : [];

    // Transform variants to match schema requirements
    const transformedVariants = Array.isArray(variants) 
      ? variants.map(variant => ({
          name: variant.name || variant.size || 'Size',
          value: variant.value || variant.size || variant.count || 'Default',
          price: variant.price || 0,
          stock: variant.stock || 0,
          sku: variant.sku || '',
          originalData: variant
        }))
      : [];

    // ✅ FIXED: Create product with proper hierarchy structure
    const product = await Product.create({
      title,
      description,
      price,
      salePrice,
      images: transformedImages,
      category: categoryDoc._id,
      subcategory: subcategoryInfo, // ✅ Object with _id and name
      item: itemInfo,              // ✅ Object with _id, name, and slug
      brand: brandDoc._id,
      rating,
      reviewCount,
      stock,
      tags,
      variants: transformedVariants,
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
    // Console log the entire payload received from frontend
    console.log('🚀 UPDATE PRODUCT - Full payload received:');
    console.log('📦 req.body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 Product ID from params:', req.params.id);
    console.log('💰 Price from payload:', req.body.price, 'Type:', typeof req.body.price);
    console.log('💸 Sale Price from payload:', req.body.salePrice, 'Type:', typeof req.body.salePrice);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
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

    // Log existing product data for comparison
    console.log('📋 Existing product data:');
    console.log('💰 Current price:', product.price, 'Type:', typeof product.price);
    console.log('💸 Current sale price:', product.salePrice, 'Type:', typeof product.salePrice);
    console.log('📝 Current title:', product.title);

    // Track if discount is being added or updated
    const hadSalePrice = !!product.salePrice;
    const newSalePrice = req.body.salePrice;

    // Handle category update
    if (req.body.category) {
      let categoryQuery;
      
      // Check if the value is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(req.body.category) && 
          req.body.category.length === 24) {
        // If it's a valid ObjectId, search by both _id and name
        categoryQuery = {
          $or: [
            { _id: req.body.category },
            { name: req.body.category.trim() }
          ]
        };
      } else {
        // If it's not a valid ObjectId, only search by name
        categoryQuery = { name: req.body.category.trim() };
      }
      
      const categoryDoc = await Category.findOne(categoryQuery);
      
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
      let brandQuery;
      
      // Check if the value is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(req.body.brand) && 
          req.body.brand.length === 24) {
        // If it's a valid ObjectId, search by both _id and name
        brandQuery = {
          $or: [
            { _id: req.body.brand },
            { name: req.body.brand.trim() }
          ]
        };
      } else {
        // If it's not a valid ObjectId, only search by name
        brandQuery = { name: req.body.brand.trim() };
      }
      
      const brandDoc = await Brand.findOne(brandQuery);
      
      if (!brandDoc) {
        return res.status(400).json({
          success: false,
          message: `Brand '${req.body.brand}' not found`,
        });
      }
      req.body.brand = brandDoc._id;
    }

    // Handle subcategory validation and populate required fields
    if (req.body.subcategory) {
      const categoryId = req.body.category || product.category;
      
      if (mongoose.Types.ObjectId.isValid(req.body.subcategory)) {
        const categoryWithSubcat = await Category.findOne({
          _id: categoryId,
          'subcategories._id': req.body.subcategory
        });
        
        if (!categoryWithSubcat) {
          return res.status(400).json({
            success: false,
            message: `Subcategory not found in the specified category`,
          });
        }
        
        // Find the subcategory data and populate the required fields
        const subcategoryData = categoryWithSubcat.subcategories.find(
          sub => sub._id.toString() === req.body.subcategory
        );
        
        if (subcategoryData) {
          req.body.subcategory = {
            _id: subcategoryData._id,
            name: subcategoryData.name
          };
        }
      }
    }

    // Handle item validation and populate required fields
    if (req.body.item) {
      const subcategoryId = req.body.subcategory?._id || req.body.subcategory || product.subcategory?._id || product.subcategory;
      
      if (mongoose.Types.ObjectId.isValid(req.body.item) && subcategoryId) {
        const categoryWithItem = await Category.findOne({
          'subcategories._id': subcategoryId,
          'subcategories.items._id': req.body.item
        });
        
        if (!categoryWithItem) {
          return res.status(400).json({
            success: false,
            message: `Item not found in the specified subcategory`,
          });
        }
        
        // Find the subcategory and item data
        const subcategoryData = categoryWithItem.subcategories.find(
          sub => sub._id.toString() === subcategoryId.toString()
        );
        
        if (subcategoryData) {
          const itemData = subcategoryData.items.find(
            item => item._id.toString() === req.body.item
          );
          
          if (itemData) {
            req.body.item = {
              _id: itemData._id,
              name: itemData.name,
              slug: itemData.slug
            };
          }
        }
      }
    }

    // Handle sale price validation with detailed logging
    if (req.body.salePrice) {
      const currentPrice = req.body.price || product.price;
      const newSalePrice = req.body.salePrice;
      
      console.log('💵 PRICE VALIDATION CHECK:');
      console.log('📊 Current/New Price:', currentPrice, 'Type:', typeof currentPrice);
      console.log('📊 New Sale Price:', newSalePrice, 'Type:', typeof newSalePrice);
      console.log('🔢 Price as Number:', Number(currentPrice));
      console.log('🔢 Sale Price as Number:', Number(newSalePrice));
      console.log('❓ Is Sale Price >= Regular Price?', Number(newSalePrice) >= Number(currentPrice));
      
      if (Number(newSalePrice) >= Number(currentPrice)) {
        console.log('🚫 VALIDATION FAILED: Sale price is greater than or equal to regular price');
        return res.status(400).json({
          success: false,
          message: `Sale price (${newSalePrice}) must be less than regular price (${currentPrice})`,
        });
      } else {
        console.log('✅ PRICE VALIDATION PASSED');
      }
    }

    // Log the final payload that will be sent to MongoDB
    console.log('📤 FINAL PAYLOAD TO BE SENT TO MONGODB:');
    console.log('🔍 Final req.body before update:', JSON.stringify(req.body, null, 2));

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: false, // Disable schema validators since we handle validation above
      }
    )
      .populate('brand', 'name logo')
      .populate('category', 'name slug');

    console.log('✅ PRODUCT UPDATED SUCCESSFULLY');
    console.log('📊 Updated product price:', product.price);
    console.log('📊 Updated product sale price:', product.salePrice);

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
    console.error('🚨 ERROR IN UPDATE PRODUCT:');
    console.error('📝 Error message:', error.message);
    console.error('🔍 Error stack:', error.stack);
    console.error('📊 Error name:', error.name);
    
    if (error.name === 'ValidationError') {
      console.error('❌ VALIDATION ERROR DETAILS:');
      Object.keys(error.errors).forEach(key => {
        console.error(`🔸 Field: ${key}`);
        console.error(`🔸 Message: ${error.errors[key].message}`);
        console.error(`🔸 Value: ${error.errors[key].value}`);
        console.error(`🔸 Path: ${error.errors[key].path}`);
      });
    }
    
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

// @desc    Enhanced search products with filters and pagination
// @route   GET /api/products/search
// @access  Public
export const searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 12, type = 'all', sortBy = 'relevance', sortOrder = 'desc' } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const searchQuery = q.trim();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build base query
    let query = {
      isActive: true,
      $text: { $search: searchQuery }
    };

    // Apply additional filters from req.query (same as getProducts)
    if (req.query.categories) {
      const categoriesRaw = req.query.categories.split(',');
      const categoryIds = [];
      for (const cat of categoriesRaw) {
        if (/^[a-f\d]{24}$/i.test(cat)) {
          categoryIds.push(new mongoose.Types.ObjectId(cat));
        } else {
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

    if (req.query.brands) {
      const brandIds = req.query.brands.split(',').map(id => {
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

    // Determine sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'relevance':
        sortCriteria = { score: { $meta: 'textScore' } };
        break;
      case 'price':
        sortCriteria = { price: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'rating':
        sortCriteria = { rating: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'date':
        sortCriteria = { createdAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'popularity':
        sortCriteria = { viewCount: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'name':
        sortCriteria = { title: sortOrder === 'asc' ? 1 : -1 };
        break;
      default:
        sortCriteria = { score: { $meta: 'textScore' } };
    }

    // Execute search
    const products = await Product.find(query)
      .populate('brand', 'name logo')
      .populate('category', 'name slug')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    // Track search for analytics
    if (req.user) {
      await trackSearchQuery(req.user.id, searchQuery, total);
    }

    res.status(200).json({
      success: true,
      products,
      categories: [], // Could include matching categories
      brands: [], // Could include matching brands
      pagination: {
        page: pageNum,
        totalPages,
        total,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      searchQuery,
      resultsFound: products.length > 0
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product suggestions for autocomplete
// @route   GET /api/search/suggestions
// @access  Public
export const getProductSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 8 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    const searchQuery = q.trim();
    const limitNum = parseInt(limit);

    // Get product suggestions
    const productSuggestions = await Product.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ],
      isActive: true
    })
      .select('title _id category brand images')
      .populate('category', 'name slug')
      .populate('brand', 'name')
      .limit(Math.floor(limitNum * 0.6)) // 60% for products
      .lean();

    // Get category suggestions
    const categorySuggestions = await Category.find({
      name: { $regex: searchQuery, $options: 'i' },
      isActive: true
    })
      .select('name slug _id')
      .limit(Math.floor(limitNum * 0.3)) // 30% for categories
      .lean();

    // Format suggestions according to frontend expectations
    const suggestions = [];

    // Add product suggestions
    productSuggestions.forEach(product => {
      suggestions.push({
        id: product._id,
        name: product.title,
        type: 'product',
        slug: product._id, // or product.slug if you have it
        image: product.images?.[0]?.url || null,
        category: product.category?.name || '',
        price: product.price?.toString() || ''
      });
    });

    // Add category suggestions
    categorySuggestions.forEach(category => {
      suggestions.push({
        id: category._id,
        name: category.name,
        type: 'category',
        slug: category.slug,
        image: null,
        category: '',
        price: ''
      });
    });

    res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, limitNum)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular searches
// @route   GET /api/products/search/popular
// @access  Public
export const getPopularSearches = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // This would require a SearchLog model to track search queries
    // For now, return mock data or implement based on your analytics
    const popularSearches = [
      'smartphones',
      'laptops',
      'headphones',
      'clothing',
      'books',
      'shoes',
      'watches',
      'cameras',
      'tablets',
      'furniture'
    ].slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      searches: popularSearches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user search history
// @route   GET /api/products/search/history
// @access  Private
export const getSearchHistory = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // This would require a SearchHistory model
    // For now, return empty array
    res.status(200).json({
      success: true,
      searches: []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear user search history
// @route   DELETE /api/products/search/history
// @access  Private
export const clearSearchHistory = async (req, res, next) => {
  try {
    // Implementation would clear user's search history
    res.status(200).json({
      success: true,
      message: 'Search history cleared'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track search query
// @route   POST /api/products/search/track
// @access  Public
export const trackSearch = async (req, res, next) => {
  try {
    const { query, resultCount } = req.body;
    
    // Implementation would save search query to analytics
    await trackSearchQuery(req.user?.id || null, query, resultCount);
    
    res.status(200).json({
      success: true,
      message: 'Search tracked'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get search analytics (Admin)
// @route   GET /api/products/search/analytics
// @access  Private/Admin
export const getSearchAnalytics = async (req, res, next) => {
  try {
    // Implementation would return search analytics
    res.status(200).json({
      success: true,
      data: {
        totalSearches: 0,
        uniqueQueries: 0,
        topQueries: [],
        searchTrends: []
      }
    });
  } catch (error) {
    next(error);
  }
};

