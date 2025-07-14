const logger = require('../utils/logger');

// Generic validation middleware factory using Joi
const validateWithJoi = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', { 
        endpoint: req.path, 
        method: req.method, 
        errors 
      });

      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    // Replace the original property with the validated (and potentially transformed) value
    req[property] = value;
    next();
  };
};

// Validate request body
const validateBody = (schema) => validateWithJoi(schema, 'body');

// Validate query parameters
const validateQuery = (schema) => validateWithJoi(schema, 'query');

// Validate route parameters
const validateParams = (schema) => validateWithJoi(schema, 'params');

// Validate both body and params
const validateBodyAndParams = (bodySchema, paramsSchema) => {
  return [
    validateWithJoi(paramsSchema, 'params'),
    validateWithJoi(bodySchema, 'body')
  ];
};

// Custom validation for MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // MongoDB ObjectId regex pattern
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      return res.status(400).json({
        message: 'Validation error',
        errors: [{
          field: paramName,
          message: `${paramName} must be a valid MongoDB ObjectId`
        }]
      });
    }
    
    next();
  };
};

// Validate multiple ObjectIds in params
const validateObjectIds = (...paramNames) => {
  return (req, res, next) => {
    const errors = [];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    paramNames.forEach(paramName => {
      const id = req.params[paramName];
      if (id && !objectIdPattern.test(id)) {
        errors.push({
          field: paramName,
          message: `${paramName} must be a valid MongoDB ObjectId`
        });
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }
    
    next();
  };
};

// Sanitize and validate file upload
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];
    const errors = [];

    files.forEach((file, index) => {
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        errors.push({
          field: `file[${index}]`,
          message: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push({
          field: `file[${index}]`,
          message: `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'File validation error',
        errors
      });
    }

    next();
  };
};

// Conditional validation - only validate if field exists
const validateIfPresent = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!req[property] || Object.keys(req[property]).length === 0) {
      return next();
    }

    return validateWithJoi(schema, property)(req, res, next);
  };
};

module.exports = {
  validateWithJoi,
  validateBody,
  validateQuery,
  validateParams,
  validateBodyAndParams,
  validateObjectId,
  validateObjectIds,
  validateFileUpload,
  validateIfPresent
};
