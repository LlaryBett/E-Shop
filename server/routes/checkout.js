import express from 'express';
import { protect as validateRequest } from '../middleware/auth.js';
import checkoutController from '../controllers/checkoutController.js';
import feesAndRatesController from '../controllers/feesAndRatesController.js'; // 👈 import new controller

const router = express.Router();

// Checkout-related routes
router.get('/user-info', validateRequest, checkoutController.getUserCheckoutInfo);
router.get('/verify-cart', validateRequest, checkoutController.verifyCartItems);
router.post('/shipping-options', validateRequest, checkoutController.getShippingOptions);
router.post('/calculate-tax', validateRequest, checkoutController.calculateTaxes);
router.post('/validate-coupon', validateRequest, checkoutController.validateCoupon);
router.get('/payment-config', validateRequest, checkoutController.getPaymentConfig);
router.post('/complete', validateRequest, checkoutController.completeCheckout);

// FeesAndRates management routes (admin or internal use only)
// You can protect these with `authorize('admin')` if needed
router.post('/fees-and-rates', validateRequest, feesAndRatesController.createFeesAndRates);
router.get('/fees-and-rates/:location', validateRequest, feesAndRatesController.getFeesAndRatesByLocation);
router.get('/fees-and-rates', validateRequest, feesAndRatesController.getAllFeesAndRates);

export default router;
