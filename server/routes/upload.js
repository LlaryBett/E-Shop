import express from 'express';
import { uploadImage, uploadImages } from '../controllers/uploadController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Protected routes (Admin only)
router.use(protect, authorize('admin'));

router.post('/image', upload.single('image'), uploadImage);
router.post('/images', upload.array('images', 10), uploadImages);

export default router;