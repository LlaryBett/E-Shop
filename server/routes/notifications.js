import express from 'express';
import { body, param, query } from 'express-validator';
import notificationsController from '../controllers/notificationsController.js';
import { protect } from '../middleware/auth.js'; // ✅ Use named import

const router = express.Router();

// Validation middleware
const validateNotificationCreation = [
  body('type')
    .isIn(['order', 'promotion', 'wishlist', 'system'])
    .withMessage('Invalid notification type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon must be maximum 10 characters'),
  body('color')
    .optional()
    .isIn(['blue', 'red', 'green', 'yellow', 'purple', 'orange'])
    .withMessage('Invalid color'),
  body('actionText')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Action text must be maximum 100 characters'),
  body('actionLink')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Action link must be maximum 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level')
];

const validateBulkOperation = [
  body('action')
    .isIn(['markRead', 'delete'])
    .withMessage('Invalid action. Use "markRead" or "delete"'),
  body('notificationIds')
    .isArray({ min: 1 })
    .withMessage('Notification IDs must be a non-empty array')
    .custom((value) => {
      if (!value.every(id => typeof id === 'string' && id.length === 24)) {
        throw new Error('Invalid notification ID format');
      }
      return true;
    })
];

const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID')
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('filter')
    .optional()
    .isIn(['all', 'unread', 'order', 'promotion', 'wishlist', 'system'])
    .withMessage('Invalid filter value'),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'unread'])
    .withMessage('Invalid sort value'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be maximum 100 characters')
];

// Apply authentication middleware to all routes
router.use(protect);

// Routes
router.get('/', validateQueryParams, notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.get('/:id', validateObjectId, notificationsController.getNotificationById);
router.post('/', validateNotificationCreation, notificationsController.createNotification);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', validateObjectId, notificationsController.markAsRead);
router.post('/bulk', validateBulkOperation, notificationsController.bulkOperations);
router.delete('/clear-all', notificationsController.clearAll);
router.delete('/:id', validateObjectId, notificationsController.deleteNotification);

export default router;
