import express from 'express';
const router = express.Router();
// Fix import: add .js extension for ES modules
import configController from '../controllers/configController.js';
import { protect } from '../middleware/auth.js';

// --- Coupon Routes ---
router.post('/coupons', protect, configController.createCoupon);
router.get('/coupons', protect, configController.getCoupons);

// --- Fees and Additional Rates ---
router.post('/fees', protect, configController.setFeesAndRates);
router.get('/fees', protect, configController.getFeesAndRates);

// --- Tax Rates (Now Range-Based) ---
router.post('/tax-rates', protect, configController.createTaxRate);
router.get('/tax-rates', protect, configController.getTaxRates);

// --- Shipping Methods ---
router.post('/shipping-methods', protect, configController.createShippingMethod);
router.get('/shipping-methods',  configController.getShippingMethods);

export default router;
