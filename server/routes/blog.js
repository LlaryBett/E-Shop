import express from 'express';
import { body } from 'express-validator';
import {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  likeBlogPost,
  addComment,
} from '../controllers/blogController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Validation rules
const blogValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('excerpt').trim().isLength({ min: 10, max: 300 }).withMessage('Excerpt must be between 10 and 300 characters'),
  body('content').trim().isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
  body('category').isIn(['news', 'tutorials', 'reviews', 'lifestyle', 'technology']).withMessage('Valid category is required'),
  body('tags').isArray().withMessage('Tags must be an array'),
];

// Public routes
router.get('/', getBlogPosts);
router.get('/:slug', getBlogPost);

// Protected routes
router.post('/:id/like', protect, likeBlogPost);
router.post('/:id/comments', protect, addComment);

// Admin routes
router.post('/', protect, authorize('admin'), upload.single('featuredImage'), blogValidation, createBlogPost);
router.put('/:id', protect, authorize('admin'), upload.single('featuredImage'), blogValidation, updateBlogPost);
router.delete('/:id', protect, authorize('admin'), deleteBlogPost);

export default router;