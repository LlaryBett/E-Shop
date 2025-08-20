import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductSuggestions,
  getPopularSearches,
  getSearchHistory,
  clearSearchHistory,
  trackSearch,
  getSearchAnalytics,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  validateProduct,
  handleValidationErrors,
} from '../middleware/validation.js';

const router = express.Router();

// ===========================================
// PUBLIC ROUTES
// ===========================================

// Main product listing
router.get('/', getProducts);

// Individual product
router.get('/:id', getProduct);

// ===========================================
// SEARCH ROUTES (Public)
// ===========================================

// Main search - matches frontend: /api/products/search?q={query}
router.get('/search', searchProducts);

// Search suggestions for autocomplete - matches frontend: /api/products/search/suggestions?q={query}&limit=8
router.get('/search/suggestions', getProductSuggestions);

// Popular/trending searches
router.get('/search/popular', getPopularSearches);

// Search tracking for analytics
router.post('/search/track', trackSearch);

// ===========================================
// USER SEARCH HISTORY ROUTES (Protected)
// ===========================================

// Get user's search history
router.get('/search/history', protect, getSearchHistory);

// Clear user's search history
router.delete('/search/history', protect, clearSearchHistory);

// ===========================================
// ADMIN ROUTES (Protected)
// ===========================================

// Create product
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  validateProduct,
  handleValidationErrors,
  createProduct
);

// Update product
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  validateProduct,
  handleValidationErrors,
  updateProduct
);

// Delete product
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteProduct
);

// Search analytics for admin dashboard
router.get(
  '/search/analytics',
  protect,
  authorize('admin'),
  getSearchAnalytics
);

export default router;