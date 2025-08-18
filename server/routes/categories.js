import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getMegaMenuCategories,
  getProductsBySubcategoryItem,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
// Update your categoryValidation to include mega menu fields
// const categoryValidation = [
//   body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
//   body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
//   body('parent').optional().isMongoId().withMessage('Valid parent category ID is required'),
//   body('menuConfig.featuredItems.*.name').optional().trim().isLength({ min: 2, max: 50 }),
//   body('menuConfig.featuredItems.*.slug').optional().trim().isSlug(),
//   body('menuConfig.displayInMegaMenu').optional().isBoolean(),
//   body('menuConfig.columnPosition').optional().isInt({ min: 1, max: 5 })
// ];

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);

router.get('/mega-menu', getMegaMenuCategories); 
router.get('/:slug', getCategory);

// Protected routes (Admin only)
// If you use upload.single('image'), your controller must handle both file and body.image
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  // categoryValidation,
  createCategory
);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  // categoryValidation,
  updateCategory
);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

// Add this route
router.get('/:categorySlug/subcategory/:itemSlug/products', getProductsBySubcategoryItem);

// Add this with your other routes


export default router;