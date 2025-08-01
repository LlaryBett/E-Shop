import express from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose'; // Don't forget this import
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderInvoice, // <-- Add this import
  reorderOrder, // <-- Add this import
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Enhanced validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').custom((value) => {
    try {
      // Handle both string ID and full product object cases
      const productId = typeof value === 'string' ? value : value?._id;
      return mongoose.Types.ObjectId.isValid(productId);
    } catch (error) {
      return false;
    }
  }).withMessage('Valid product ID or object is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.firstName').trim().notEmpty().withMessage('First name is required'),
  body('shippingAddress.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('shippingAddress.email').isEmail().withMessage('Valid email is required'),
  body('shippingAddress.address').trim().notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('paymentMethod').isIn(['stripe', 'paypal', 'cash_on_delivery', 'card']).withMessage('Valid payment method is required'),
  body('shippingMethod')
    .custom((value) => {
      // Accept valid MongoDB ObjectId for shippingMethod
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Valid shipping method is required'),
];

// Protected routes
router.use(protect);

router.post('/', orderValidation, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.get('/:id/invoice', getOrderInvoice); // <-- Add this route
router.post('/:id/reorder', reorderOrder); // <-- Add reorder route
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.put('/:id/status', authorize('admin'), updateOrderStatus);

export default router;