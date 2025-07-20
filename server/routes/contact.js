import express from 'express';
import {
  submitContactForm,
  getAllMessages,
  updateMessageStatus,
  deleteMessage,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', submitContactForm);

// Admin-only routes
router.get('/', protect, authorize('admin'), getAllMessages);
router.patch('/:id', protect, authorize('admin'), updateMessageStatus);
router.delete('/:id', protect, authorize('admin'), deleteMessage);

export default router;
