import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get current user's wishlist
router.get('/', protect, getWishlist);

// Add a product to wishlist
router.post('/', protect, addToWishlist);

// Remove a product from wishlist
router.delete('/:productId', protect, removeFromWishlist);

// Clear all wishlist items
router.delete('/', protect, clearWishlist);

export default router;
