import Notification from '../models/Notification.js';
import { validationResult } from 'express-validator';
import NotificationService from '../middleware/NotificationService.js';
import NotificationEvent from '../models/NotificationEvent.js'; // <-- Add this import

class NotificationsController {
  // Get all notifications for a user
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        filter = 'all',
        sortBy = 'newest',
        search = ''
      } = req.query;

      // Build filter query
      let filterQuery = { userId };
      
      if (filter === 'unread') {
        filterQuery.isRead = false;
      } else if (filter !== 'all') {
        filterQuery.type = filter;
      }

      // Add search functionality
      if (search) {
        filterQuery.$or = [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort query
      let sortQuery = {};
      switch (sortBy) {
        case 'oldest':
          sortQuery.createdAt = 1;
          break;
        case 'unread':
          sortQuery.isRead = 1;
          sortQuery.createdAt = -1;
          break;
        case 'newest':
        default:
          sortQuery.createdAt = -1;
          break;
      }

      // Execute query with pagination
      const notifications = await Notification.find(filterQuery)
        .sort(sortQuery)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      // Get total count for pagination
      const total = await Notification.countDocuments(filterQuery);
      const unreadCount = await Notification.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          },
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
        error: error.message
      });
    }
  }

  // Create new notification
  async createNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const notificationData = {
        userId,
        ...req.body
      };

      const notification = new Notification(notificationData);
      await notification.save();

      res.status(201).json({
        success: true,
        data: { notification },
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: error.message
      });
    }
  }

  // Mark single notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({ _id: id, userId });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      if (!notification.isRead) {
        await notification.markAsRead();
      }

      res.json({
        success: true,
        data: { notification },
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await Notification.markAllAsRead(userId);

      res.json({
        success: true,
        data: { 
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        },
        message: `${result.modifiedCount} notifications marked as read`
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  // Delete single notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOneAndDelete({ _id: id, userId });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: { notification },
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  // Clear all notifications
  async clearAll(req, res) {
    try {
      const userId = req.user.id;
      const result = await Notification.clearAll(userId);

      res.json({
        success: true,
        data: { deletedCount: result.deletedCount },
        message: `${result.deletedCount} notifications cleared`
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear all notifications',
        error: error.message
      });
    }
  }

  // Bulk operations
  async bulkOperations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { action, notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification IDs'
        });
      }

      let result;
      let message;

      switch (action) {
        case 'markRead':
          result = await Notification.updateMany(
            { _id: { $in: notificationIds }, userId, isRead: false },
            { isRead: true, updatedAt: new Date() }
          );
          message = `${result.modifiedCount} notifications marked as read`;
          break;

        case 'delete':
          result = await Notification.deleteMany({
            _id: { $in: notificationIds },
            userId
          });
          message = `${result.deletedCount} notifications deleted`;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use "markRead" or "delete"'
          });
      }

      res.json({
        success: true,
        data: result,
        message
      });
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation',
        error: error.message
      });
    }
  }

  // Get notification by ID
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({ _id: id, userId });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: { notification }
      });
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification',
        error: error.message
      });
    }
  }

  // Create notification event template
  async createNotificationEvent(req, res) {
    try {
      const event = await NotificationEvent.create(req.body);
      res.status(201).json({ success: true, event });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all notification event templates
  async getNotificationEvents(req, res) {
    try {
      const events = await NotificationEvent.find();
      res.json({ success: true, events });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

// Example: Send a system notification to a user
export const sendSystemNotificationToUser = async (userId, { title, message, actionText, actionLink, priority }) => {
  // Yes, you can import and use this function in any controller (e.g., userController, orderController, etc.)
  // Example usage in another controller:
  // import { sendSystemNotificationToUser } from './notificationsController.js';
  // await sendSystemNotificationToUser(userId, { title, message, ... });
  await NotificationService.sendSystemNotification(userId, {
    title,
    message,
    icon: '🔔',
    color: 'blue',
    actionText,
    actionLink,
    priority: priority || 'medium'
  });
};

// Helper: Send contact reply notification to user
export const sendContactReplyNotification = async (userId, { subject, reply }) => {
  await NotificationService.sendSystemNotification(userId, {
    title: 'Reply to your contact message',
    message: reply,
    icon: '📩',
    color: 'green',
    actionText: 'View Message',
    actionLink: '/account/messages', // adjust as needed
    priority: 'high',
    meta: { subject }
  });
};

export default new NotificationsController();