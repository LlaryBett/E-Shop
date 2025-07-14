import express from 'express';
import { body } from 'express-validator';
import {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ✅ Updated validation rules for accepting category name
const brandValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Brand name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Description cannot exceed 300 characters'),
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category name is required'),
  body('logo')
    .optional()
    .isURL()
    .withMessage('Logo must be a valid image URL'),
];

// ✅ Public routes
router.get('/', getAllBrands);
router.get('/:id', getBrandById);

// ✅ Protected routes (Admin only)
router.post('/', protect, authorize('admin'), brandValidation, createBrand);
router.put('/:id', protect, authorize('admin'), brandValidation, updateBrand);
router.delete('/:id', protect, authorize('admin'), deleteBrand);

export default router;
