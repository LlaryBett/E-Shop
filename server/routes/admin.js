import express from 'express';
import {
  getDashboardStats,
  getAllOrders,
  getAllProducts,
  getSalesAnalytics,
getBanners,
  uploadBanners,
  deleteBanner,
  updateBanner
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/products', getAllProducts);
router.get('/analytics/sales', getSalesAnalytics);

// Banner management routes
router.route('/banners')
  .get(getBanners)
  .post(upload.array('banners', 10), handleMulterError, uploadBanners);

router.route('/banners/:id')
  .delete(deleteBanner)
  .put(updateBanner);

export default router;