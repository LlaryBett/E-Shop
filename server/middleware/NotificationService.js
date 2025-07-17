import Notification from '../models/Notification.js';

class NotificationService {
  // Create notification for a user
  async createNotification(userId, notificationData) {
    try {
      const notification = new Notification({
        userId,
        ...notificationData
      });
      
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for multiple users
  async createBulkNotifications(userIds, notificationData) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        ...notificationData
      }));
      
      const result = await Notification.insertMany(notifications);
      return result;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Send order notifications
  async sendOrderNotification(userId, orderData) {
    const notifications = {
      'order_confirmed': {
        type: 'order',
        title: 'Order Confirmed',
        message: `Your order #${orderData.orderNumber} has been confirmed and is being processed.`,
        icon: '✅',
        color: 'green',
        actionText: 'View Order',
        actionLink: `/orders/${orderData.orderId}`,
        priority: 'high'
      },
      'order_shipped': {
        type: 'order',
        title: 'Order Shipped',
        message: `Your order #${orderData.orderNumber} has been shipped and will arrive in ${orderData.estimatedDays} business days.`,
        icon: '📦',
        color: 'blue',
        actionText: 'Track Order',
        actionLink: `/orders/${orderData.orderId}/track`,
        priority: 'high'
      },
      'order_delivered': {
        type: 'order',
        title: 'Order Delivered',
        message: `Your order #${orderData.orderNumber} has been delivered successfully. Rate your experience!`,
        icon: '🎉',
        color: 'green',
        actionText: 'Rate Order',
        actionLink: `/orders/${orderData.orderId}/rate`,
        priority: 'medium'
      }
    };

    const notificationData = notifications[orderData.status];
    if (notificationData) {
      return await this.createNotification(userId, notificationData);
    }
  }

  // Send promotion notifications
  async sendPromotionNotification(userIds, promotionData) {
    const notificationData = {
      type: 'promotion',
      title: promotionData.title,
      message: promotionData.message,
      icon: '🔥',
      color: 'red',
      actionText: promotionData.actionText || 'Shop Now',
      actionLink: promotionData.actionLink || '/shop',
      priority: 'medium'
    };

    return await this.createBulkNotifications(userIds, notificationData);
  }

  // Send wishlist notifications
  async sendWishlistNotification(userId, wishlistData) {
    const notifications = {
      'price_drop': {
        type: 'wishlist',
        title: 'Price Drop Alert',
        message: `${wishlistData.productName} in your wishlist is now ${wishlistData.discount}% off!`,
        icon: '💰',
        color: 'green',
        actionText: 'Buy Now',
        actionLink: `/products/${wishlistData.productId}`,
        priority: 'medium'
      },
      'back_in_stock': {
        type: 'wishlist',
        title: 'Back in Stock',
        message: `${wishlistData.productName} is back in stock! Get it before it runs out again.`,
        icon: '📦',
        color: 'green',
        actionText: 'Buy Now',
        actionLink: `/products/${wishlistData.productId}`,
        priority: 'high'
      }
    };

    const notificationData = notifications[wishlistData.type];
    if (notificationData) {
      return await this.createNotification(userId, notificationData);
    }
  }

  // Send system notifications
  async sendSystemNotification(userId, systemData) {
    const notificationData = {
      type: 'system',
      title: systemData.title,
      message: systemData.message,
      icon: systemData.icon || '🔔',
      color: systemData.color || 'blue',
      actionText: systemData.actionText,
      actionLink: systemData.actionLink,
      priority: systemData.priority || 'medium'
    };

    return await this.createNotification(userId, notificationData);
  }

  // Clean up old notifications (can be run as a cron job)
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            unread: { $sum: { $cond: ['$isRead', 0, 1] } },
            read: { $sum: { $cond: ['$isRead', 1, 0] } }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

export default new NotificationService();