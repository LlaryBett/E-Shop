import express from 'express';
import {
  getDashboardStats,
  getAllOrders,
  getAllProducts,
  getSalesAnalytics,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/products', getAllProducts);
router.get('/analytics/sales', getSalesAnalytics);

export default router;