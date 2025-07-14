import crypto from 'crypto';

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate order number
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD-${timestamp.slice(-8)}-${random}`;
};

// Generate SKU
export const generateSKU = (productTitle, brand) => {
  const titlePart = productTitle.replace(/[^a-zA-Z0-9]/g, '').substr(0, 6).toUpperCase();
  const brandPart = brand.replace(/[^a-zA-Z0-9]/g, '').substr(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${brandPart}-${titlePart}-${randomPart}`;
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Calculate discount percentage
export const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (!salePrice || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Slugify string
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Paginate results
export const paginate = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    page: currentPage,
    limit: itemsPerPage,
    totalPages,
    total,
    skip,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

// Calculate shipping cost
export const calculateShipping = (weight, distance, method = 'standard') => {
  const baseRates = {
    standard: 5.99,
    express: 12.99,
    overnight: 24.99,
  };

  const weightMultiplier = Math.ceil(weight / 1000) * 0.5; // $0.50 per kg
  const distanceMultiplier = distance > 500 ? 2 : 1;

  return baseRates[method] * distanceMultiplier + weightMultiplier;
};

// Calculate tax
export const calculateTax = (amount, taxRate = 0.08) => {
  return amount * taxRate;
};

// Generate barcode
export const generateBarcode = () => {
  return Math.random().toString().substr(2, 12);
};

// Validate and format phone number
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Calculate estimated delivery date
export const calculateDeliveryDate = (shippingMethod, orderDate = new Date()) => {
  const deliveryDays = {
    standard: 7,
    express: 3,
    overnight: 1,
  };

  const days = deliveryDays[shippingMethod] || 7;
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + days);

  return deliveryDate;
};

// Generate tracking number
export const generateTrackingNumber = () => {
  const prefix = 'TRK';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove sensitive data from user object
export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  delete userObj.emailVerificationToken;
  delete userObj.emailVerificationExpire;
  return userObj;
};

// Generate secure random token
export const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};