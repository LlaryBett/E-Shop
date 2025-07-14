import express from 'express';
import { body } from 'express-validator';
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

const router = express.Router();

// ✅ Updated Validation Rules
const productValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category name is required'),

  body('brand')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Brand name is required'),

  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
];

// ✅ Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/suggestions', getProductSuggestions);
router.get('/:id', getProduct);

// ✅ Protected routes (Admin only)
router.post('/', protect, authorize('admin'), upload.array('images', 5), productValidation, createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), productValidation, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
