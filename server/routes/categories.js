import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('parent').optional().isMongoId().withMessage('Valid parent category ID is required'),
];

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:slug', getCategory);

// Protected routes (Admin only)
// If you use upload.single('image'), your controller must handle both file and body.image
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  categoryValidation,
  createCategory
);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.single('image'),
  categoryValidation,
  updateCategory
);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;