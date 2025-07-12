const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cart.product',
        select: 'title price salePrice images stock status brand',
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

    // Filter out inactive products and calculate totals
    const activeCartItems = user.cart.filter(item => 
      item.product && item.product.status === 'active'
    );

    // Calculate cart summary
    let subtotal = 0;
    let totalItems = 0;
    
    const cartItems = activeCartItems.map(item => {
      const currentPrice = item.product.salePrice || item.product.price;
      const itemTotal = currentPrice * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        variant: item.variant,
        currentPrice,
        itemTotal,
        addedAt: item.addedAt
      };
    });

    // Update user's cart to remove inactive products
    if (activeCartItems.length !== user.cart.length) {
      user.cart = activeCartItems;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        cart: cartItems,
        summary: {
          totalItems,
          subtotal,
          itemCount: cartItems.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
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

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(item => 
      item.product.toString() === productId && 
      item.variant === variant
    );

    if (existingItemIndex > -1) {
      // Update quantity of existing item
      const newQuantity = user.cart[existingItemIndex].quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Not enough stock for the requested quantity'
        });
      }

      user.cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      user.cart.push({
        product: productId,
        quantity,
        variant,
        addedAt: new Date()
      });
    }

    await user.save();

    // Populate the cart for response
    await user.populate({
      path: 'cart.product',
      select: 'title price salePrice images stock status brand'
    });

    const addedItem = user.cart.find(item => 
      item.product._id.toString() === productId && 
      item.variant === variant
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cartItem: addedItem,
        cartItemCount: user.cartItemCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/:itemId', auth, validateObjectId, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const user = await User.findById(req.user._id);
    const cartItem = user.cart.id(req.params.itemId);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Verify product stock
    const product = await Product.findById(cartItem.product);
    if (!product || product.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    cartItem.quantity = quantity;
    await user.save();

    await user.populate({
      path: 'cart.product',
      select: 'title price salePrice images stock status brand'
    });

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cartItem: user.cart.id(req.params.itemId),
        cartItemCount: user.cartItemCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', auth, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const cartItem = user.cart.id(req.params.itemId);

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    user.cart.pull({ _id: req.params.itemId });
    await user.save();

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cartItemCount: user.cartItemCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error removing cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cartItemCount: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error clearing cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/cart/sync
// @desc    Sync cart from local storage (useful for login)
// @access  Private
router.post('/sync', auth, async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({
        success: false,
        message: 'Cart items must be an array'
      });
    }

    const user = await User.findById(req.user._id);

    // Validate and merge cart items
    const validatedItems = [];
    
    for (const item of cartItems) {
      if (!item.productId || !item.quantity) continue;

      // Verify product exists and is active
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'active') continue;

      // Check if item already exists in user's cart
      const existingItemIndex = user.cart.findIndex(cartItem => 
        cartItem.product.toString() === item.productId &&
        cartItem.variant === item.variant
      );

      if (existingItemIndex > -1) {
        // Update existing item with higher quantity
        const newQuantity = Math.max(
          user.cart[existingItemIndex].quantity,
          item.quantity
        );
        
        if (product.stock >= newQuantity) {
          user.cart[existingItemIndex].quantity = newQuantity;
        }
      } else {
        // Add new item if stock allows
        if (product.stock >= item.quantity) {
          validatedItems.push({
            product: item.productId,
            quantity: item.quantity,
            variant: item.variant,
            addedAt: new Date()
          });
        }
      }
    }

    // Add validated new items
    user.cart.push(...validatedItems);
    await user.save();

    // Populate cart for response
    await user.populate({
      path: 'cart.product',
      select: 'title price salePrice images stock status brand'
    });

    res.json({
      success: true,
      message: 'Cart synced successfully',
      data: {
        cartItemCount: user.cartItemCount,
        syncedItems: validatedItems.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error syncing cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
