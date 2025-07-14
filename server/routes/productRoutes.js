import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductSuggestions,
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validateProduct } from '../middleware/validation.js'; // ✅ use central validator

const router = express.Router();

// ✅ Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/suggestions', getProductSuggestions);
router.get('/:id', getProduct);

// ✅ Protected routes (Admin only)
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  validateProduct,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  validateProduct,
  updateProduct
);

router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
