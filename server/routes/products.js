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

// ✅ Enhanced Validation Rules
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
    .isFloat({ min: 0.01 })
    .withMessage('Price must be at least 0.01'),

  body('salePrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Sale price must be at least 0.01'),
    
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .custom(async (value) => {
      const category = await Category.findOne({ 
        $or: [{ _id: value }, { name: value.trim() }] 
      });
      if (!category) throw new Error('Category not found');
    }),

  body('brand')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .custom(async (value) => {
      const brand = await Brand.findOne({ 
        $or: [{ _id: value }, { name: value.trim() }] 
      });
      if (!brand) throw new Error('Brand not found');
    }),

  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be 0 or greater'),

  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 images allowed'),

  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
];

// ✅ Public routes
router.get('/', getProducts); // Now handles both public and admin cases
router.get('/search', searchProducts);
router.get('/suggestions', getProductSuggestions);
router.get('/:id', getProduct); // Now properly checks product visibility

// ✅ Protected Admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  productValidation,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  productValidation,
  updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteProduct
);

export default router;