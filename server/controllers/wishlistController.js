import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product');
    res.status(200).json({
      success: true,
      items: wishlist?.items || [],
    });
  } catch (err) {
    console.error('Get Wishlist Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Add a product to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: [{ product: productId }],
      });
    } else {
      const alreadyExists = wishlist.items.some(
        (item) => item.product.toString() === productId
      );

      if (!alreadyExists) {
        wishlist.items.push({ product: productId });
      }
    }

    await wishlist.save();
    await wishlist.populate('items.product');

    res.status(200).json({ success: true, items: wishlist.items });
  } catch (err) {
    console.error('Add to Wishlist Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove a product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate('items.product');

    res.status(200).json({ success: true, items: wishlist.items });
  } catch (err) {
    console.error('Remove from Wishlist Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (wishlist) {
      wishlist.items = [];
      await wishlist.save();
    }

    res.status(200).json({ success: true, message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Clear Wishlist Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
