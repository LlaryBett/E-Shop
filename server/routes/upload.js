import express from 'express';
import { uploadImage, uploadImages } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Remove admin-only restriction so any authenticated user can upload images
router.use(protect); // Only authentication required, not admin

router.post('/image', upload.single('image'), uploadImage);
router.post('/images', upload.array('images', 10), uploadImages);

export default router;