import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

// Enhanced error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Product validation rules
const validateProduct = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('salePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Sale price must be a positive number')
    .custom((value, { req }) => {
      if (value && value >= req.body.price) {
        throw new Error('Sale price must be less than regular price');
      }
      return true;
    }),
body('category')
  .notEmpty()
  .withMessage('Category is required')
  .custom(async (value) => {
    console.log('🔍 Validating category:', value);

    if (mongoose.Types.ObjectId.isValid(value)) {
      console.log('✅ Value is a valid ObjectId');
      const exists = await Category.findById(value);
      console.log('📦 Category.findById result:', exists);

      if (!exists) throw new Error('Category is not defined');
      return true;
    }

    const trimmedName = value.trim();
    console.log('✂️ Trimmed category name:', trimmedName);

    if (!trimmedName) throw new Error('Category name cannot be empty');

    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    console.log('🔍 Category.findOne result:', category);

    if (!category) {
      const names = await Category.find({}).then(cs => cs.map(c => c.name).join(', '));
      throw new Error(`Category '${value}' not found. Available categories: ${names}`);
    }

    return true;
  }),
body('brand')
  .notEmpty()
  .withMessage('Brand is required')
  .custom(async (value) => {
    console.log('🔍 Validating brand:', value);

    if (mongoose.Types.ObjectId.isValid(value)) {
      console.log('✅ Value is a valid ObjectId');
      const exists = await Brand.findById(value);
      console.log('📦 Brand.findById result:', exists);

      if (!exists) throw new Error('Brand is not defined');
      return true;
    }

    const trimmedName = value.trim();
    console.log('✂️ Trimmed brand name:', trimmedName);

    if (!trimmedName) throw new Error('Brand name cannot be empty');

    const brand = await Brand.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    console.log('🔍 Brand.findOne result:', brand);

    if (!brand) throw new Error(`Brand '${value}' not found.`);
    return true;
    
  }),


  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('images')
    .isArray({ min: 1 })
    .withMessage('At least one image is required'),

  handleValidationErrors
];

const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('shippingAddress.lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
  body('shippingAddress.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Phone number is required'),
  body('shippingAddress.address').trim().notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters'),
  handleValidationErrors
];

const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID'),
  handleValidationErrors
];

const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateProduct,
  validateOrder,
  validateReview,
  validateCategory,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};