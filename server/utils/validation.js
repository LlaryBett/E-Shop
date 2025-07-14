import validator from 'validator';

// Email validation
export const isValidEmail = (email) => {
  return validator.isEmail(email);
};

// Phone validation
export const isValidPhone = (phone) => {
  return validator.isMobilePhone(phone);
};

// Password strength validation
export const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  });
};

// URL validation
export const isValidURL = (url) => {
  return validator.isURL(url);
};

// MongoDB ObjectId validation
export const isValidObjectId = (id) => {
  return validator.isMongoId(id);
};

// Credit card validation
export const isValidCreditCard = (cardNumber) => {
  return validator.isCreditCard(cardNumber);
};

// Sanitize HTML
export const sanitizeHTML = (html) => {
  return validator.escape(html);
};

// Validate price
export const isValidPrice = (price) => {
  return validator.isFloat(price.toString(), { min: 0 });
};

// Validate quantity
export const isValidQuantity = (quantity) => {
  return validator.isInt(quantity.toString(), { min: 1 });
};

// Validate ZIP code
export const isValidZipCode = (zipCode, locale = 'US') => {
  return validator.isPostalCode(zipCode, locale);
};

// Custom validation for product SKU
export const isValidSKU = (sku) => {
  const skuRegex = /^[A-Z0-9-]{3,20}$/;
  return skuRegex.test(sku);
};

// Validate image file type
export const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

// Validate file size (in bytes)
export const isValidFileSize = (size, maxSizeInMB = 5) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
};