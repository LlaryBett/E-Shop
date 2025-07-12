const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        match: { status: 'active' },
        select: 'title price salePrice images rating stock brand category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out null products (inactive/deleted products)
    const activeWishlistItems = user.wishlist.filter(item => item !== null);

    // Update user's wishlist to remove inactive products
    if (activeWishlistItems.length !== user.wishlist.length) {
      user.wishlist = activeWishlistItems.map(item => item._id);
      await user.save();
    }

    res.json({
      success: true,
      data: {
        wishlist: activeWishlistItems,
        totalItems: activeWishlistItems.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if item already exists in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    user.wishlist.push(productId);
    await user.save();

    // Populate the added product for response
    await user.populate({
      path: 'wishlist',
      match: { _id: productId },
      select: 'title price salePrice images rating stock brand category',
      populate: {
        path: 'category',
        select: 'name'
      }
    });

    const addedProduct = user.wishlist.find(item => 
      item._id.toString() === productId
    );

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: {
        product: addedProduct,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding item to wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/:productId', auth, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if item exists in wishlist
    if (!user.wishlist.includes(req.params.productId)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    user.wishlist.pull(req.params.productId);
    await user.save();

    res.json({
      success: true,
      message: 'Product removed from wishlist successfully',
      data: {
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error removing item from wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/wishlist
// @desc    Clear entire wishlist
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = [];
    await user.save();

    res.json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        wishlistCount: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error clearing wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/wishlist/toggle
// @desc    Toggle item in wishlist (add if not present, remove if present)
// @access  Private
router.post('/toggle', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    const user = await User.findById(req.user._id);
    const isInWishlist = user.wishlist.includes(productId);

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist.pull(productId);
      await user.save();

      res.json({
        success: true,
        message: 'Product removed from wishlist',
        data: {
          action: 'removed',
          inWishlist: false,
          wishlistCount: user.wishlist.length
        }
      });
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      await user.save();

      res.json({
        success: true,
        message: 'Product added to wishlist',
        data: {
          action: 'added',
          inWishlist: true,
          wishlistCount: user.wishlist.length
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error toggling wishlist item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/wishlist/move-to-cart
// @desc    Move item from wishlist to cart
// @access  Private
router.post('/move-to-cart', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if product is in wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    // Check if item already exists in cart
    const existingCartItemIndex = user.cart.findIndex(item => 
      item.product.toString() === productId && 
      item.variant === variant
    );

    if (existingCartItemIndex > -1) {
      // Update quantity of existing cart item
      const newQuantity = user.cart[existingCartItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Not enough stock for the requested quantity'
        });
      }

      user.cart[existingCartItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        variant,
        addedAt: new Date()
      });
    }

    // Remove from wishlist
    user.wishlist.pull(productId);
    await user.save();

    res.json({
      success: true,
      message: 'Product moved from wishlist to cart successfully',
      data: {
        cartItemCount: user.cartItemCount,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error moving item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/wishlist/move-all-to-cart
// @desc    Move all items from wishlist to cart
// @access  Private
router.post('/move-all-to-cart', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'title price stock status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const movedItems = [];
    const failedItems = [];

    // Process each wishlist item
    for (const product of user.wishlist) {
      if (!product || product.status !== 'active') {
        failedItems.push({
          productId: product?._id,
          reason: 'Product not found or inactive'
        });
        continue;
      }

      if (product.stock < 1) {
        failedItems.push({
          productId: product._id,
          productName: product.title,
          reason: 'Out of stock'
        });
        continue;
      }

      // Check if item already exists in cart
      const existingCartItemIndex = user.cart.findIndex(item => 
        item.product.toString() === product._id.toString()
      );

      if (existingCartItemIndex > -1) {
        // Update quantity of existing cart item
        const newQuantity = user.cart[existingCartItemIndex].quantity + 1;
        
        if (product.stock >= newQuantity) {
          user.cart[existingCartItemIndex].quantity = newQuantity;
          movedItems.push({
            productId: product._id,
            productName: product.title,
            action: 'updated'
          });
        } else {
          failedItems.push({
            productId: product._id,
            productName: product.title,
            reason: 'Not enough stock'
          });
        }
      } else {
        // Add new item to cart
        user.cart.push({
          product: product._id,
          quantity: 1,
          addedAt: new Date()
        });
        movedItems.push({
          productId: product._id,
          productName: product.title,
          action: 'added'
        });
      }
    }

    // Clear wishlist for successfully moved items
    user.wishlist = user.wishlist.filter(productId => 
      !movedItems.some(item => item.productId.toString() === productId.toString())
    );

    await user.save();

    res.json({
      success: true,
      message: `${movedItems.length} items moved to cart successfully`,
      data: {
        movedItems,
        failedItems,
        cartItemCount: user.cartItemCount,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error moving items to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', auth, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const inWishlist = user.wishlist.includes(req.params.productId);

    res.json({
      success: true,
      data: {
        inWishlist,
        productId: req.params.productId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error checking wishlist status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
