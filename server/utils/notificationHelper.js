// Utility functions for notifications

const formatNotificationMessage = (template, data) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
};

const getNotificationIcon = (type) => {
  const icons = {
    order: '📦',
    promotion: '🔥',
    wishlist: '💰',
    system: '🔔',
    security: '🔒',
    payment: '💳',
    shipping: '🚚',
    review: '⭐',
    welcome: '🎉',
    update: '🔄'
  };
  
  return icons[type] || '📋';
};

const getNotificationColor = (type, priority = 'medium') => {
  const colors = {
    order: 'blue',
    promotion: 'red',
    wishlist: 'green',
    system: 'yellow',
    security: 'red',
    payment: 'purple',
    shipping: 'blue',
    review: 'orange',
    welcome: 'purple',
    update: 'blue'
  };
  
  // High priority notifications get more attention
  if (priority === 'high') {
    return 'red';
  }
  
  return colors[type] || 'blue';
};

const validateNotificationData = (data) => {
  const required = ['type', 'title', 'message'];
  const errors = [];
  
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  
  if (data.type && !['order', 'promotion', 'wishlist', 'system'].includes(data.type)) {
    errors.push('Invalid notification type');
  }
  
  if (data.title && data.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }
  
  if (data.message && data.message.length > 1000) {
    errors.push('Message must be 1000 characters or less');
  }
  
  return errors;
};

const generateNotificationId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const sanitizeNotificationData = (data) => {
  const sanitized = { ...data };
  
  // Remove any potentially harmful HTML/script tags
  if (sanitized.title) {
    sanitized.title = sanitized.title.replace(/<[^>]*>/g, '');
  }
  
  if (sanitized.message) {
    sanitized.message = sanitized.message.replace(/<[^>]*>/g, '');
  }
  
  // Ensure proper data types
  if (sanitized.isRead !== undefined) {
    sanitized.isRead = Boolean(sanitized.isRead);
  }
  
  return sanitized;
};

module.exports = {
  formatNotificationMessage,
  getNotificationIcon,
  getNotificationColor,
  validateNotificationData,
  generateNotificationId,
  isValidObjectId,
  sanitizeNotificationData
};